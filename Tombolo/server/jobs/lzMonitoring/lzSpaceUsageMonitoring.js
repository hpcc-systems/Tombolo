const models = require('../../models');
const { parentPort } = require('worker_threads');
const { decryptString } = require('../../utils/cipher');
const { FileSprayService } = require('@hpcc-js/comms');
const { getClusterOptions } = require('../../utils/getClusterOptions');
const { generateNotificationId } = require('../jobMonitoring/monitorJobsUtil');
const {
  getFilesFromLandingZoneRecursivly,
  findLocalDateTimeAtCluster,
  convertBytes,
  formatSize,
} = require('./lzFileMonitoringUtils');

const {
  LandingZoneMonitoring,
  Cluster,
  MonitoringType,
  NotificationQueue,
  AsrProduct,
  AsrDomain,
} = models;

const monitoring_name = 'Landing Zone Monitoring';

(async () => {
  // Get monitoring type ID for "Landing Zone Monitoring"
  const { id } = await MonitoringType.findOne({
    where: { name: monitoring_name },
    raw: true,
  });
  if (!id) {
    throw new Error(`Monitoring type ${monitoring_name} not found.`);
  }
  const monitoringTypeId = id;

  // Start time
  const startTime = new Date().getTime();
  try {
    parentPort.postMessage({
      level: 'info',
      text: 'Landing Zone (space usage) Monitoring started',
    });

    // Get all lz monitoring with isActive = true and approvalStatus = approved
    const activeLzMonitorings = await LandingZoneMonitoring.findAll({
      where: {
        isActive: true,
        approvalStatus: 'approved',
        lzMonitoringType: 'spaceUsage',
      },

      include: [
        {
          model: Cluster,
          as: 'cluster',
          required: true,
          attributes: [
            'id',
            'name',
            'thor_host',
            'thor_port',
            'username',
            'hash',
            'allowSelfSigned',
            'timezone_offset',
          ],
        },
      ],
      raw: true,
      nest: true,
    });

    // If 0 activeLzMonitorings, log and return
    if (activeLzMonitorings.length === 0) {
      parentPort.postMessage({
        level: 'verbose',
        text: 'No active landing zone (space usage) monitoring found',
      });
      return;
    }

    // Get unique clusters and decrypt passwords
    const uniqueClusters = [];
    activeLzMonitorings.forEach(lzMonitoring => {
      // Check if cluster is already in uniqueClusters array
      let isClusterIdUnique = true;
      uniqueClusters.forEach(c => {
        if (c.id == lzMonitoring.clusterId) {
          isClusterIdUnique = false;
        }
      });

      if (isClusterIdUnique) {
        let clusterPw;
        if (lzMonitoring.cluster.hash) {
          clusterPw = decryptString(lzMonitoring.cluster.hash);
        }
        uniqueClusters.push({ ...lzMonitoring.cluster, password: clusterPw });
      }
    });

    parentPort.postMessage({
      level: 'verbose',
      text: `${activeLzMonitorings.length} active landing zone monitoring(s) tracking space usage`,
    });

    // Create uniqueClustersObj for easy access
    const uniqueClustersObj = {};
    uniqueClusters.forEach(c => {
      uniqueClustersObj[c.id] = c;
    });

    // Array to store directories that violated thresholds
    const directoriesViolatingThreshold = [];

    // Iterate over activeLzMonitorings and check space usage
    for (const monitoring of activeLzMonitorings) {
      try {
        const {
          id: lzSpaceUsageMonitoringId,
          clusterId,
          depth,
          fileNameToMatch,
          metaData: { monitoringData },
        } = monitoring;

        // Destructure monitoringData
        const {
          dropzone,
          machine,
          directory,
          minThreshold,
          maxThreshold,
          minSizeThresholdUnit,
          maxSizeThresholdUnit,
        } = monitoringData;

        // Get FileSprayService instance
        const fss = new FileSprayService(
          getClusterOptions(
            {
              baseUrl: `${uniqueClustersObj[clusterId].thor_host}:${uniqueClustersObj[clusterId].thor_port}`,
              userID: uniqueClustersObj[clusterId].username || '',
              password: uniqueClustersObj[clusterId].password || '',
            },
            uniqueClustersObj[clusterId].allowSelfSigned
          )
        );

        // Get files recursively from the directory
        const files = await getFilesFromLandingZoneRecursivly({
          lzFileMovementMonitoringId: lzSpaceUsageMonitoringId,
          depth: depth || 10, // Default depth if not specified
          fss,
          DropZoneName: dropzone,
          Netaddr: machine,
          Path: directory,
          directoryOnly: false,
          fileNameToMatch: fileNameToMatch || '*',
        });

        // Calculate total directory size in bytes
        const totalSizeBytes = files
          .filter(f => !f.isDir && f.filesize > 0) // Only actual files with valid sizes
          .reduce((total, file) => total + file.filesize, 0);

        // Convert to threshold units for comparison
        const directorySizeInMinUnit = convertBytes(
          totalSizeBytes,
          minSizeThresholdUnit
        );
        const directorySizeInMaxUnit = convertBytes(
          totalSizeBytes,
          maxSizeThresholdUnit
        );

        // Check if space usage violates thresholds
        let violationType = null;
        if (directorySizeInMinUnit < minThreshold) {
          violationType = 'below_minimum';
        } else if (directorySizeInMaxUnit > maxThreshold) {
          violationType = 'above_maximum';
        }

        if (violationType) {
          directoriesViolatingThreshold.push({
            lzSpaceUsageMonitoringId,
            totalSizeBytes,
            violationType,
            monitoring,
          });
        }
      } catch (error) {
        parentPort.postMessage({
          level: 'error',
          text: `Error while calculating space usage from File Spray service: ${error.message}`,
        });
      }
    }

    // If no violations found, log and return
    if (directoriesViolatingThreshold.length === 0) {
      parentPort.postMessage({
        level: 'verbose',
        text: 'Landing zone (space usage) monitoring did not find any directories violating space usage thresholds',
      });
      return;
    }

    // Queue notification for each directory violating threshold
    parentPort.postMessage({
      level: 'info',
      text: `Queuing notification for ${directoriesViolatingThreshold.length} director(ies) violating space usage thresholds`,
    });

    for (const violation of directoriesViolatingThreshold) {
      try {
        const { totalSizeBytes, violationType, monitoring } = violation;

        const {
          clusterId,
          applicationId,
          metaData: {
            asrSpecificMetaData,
            contacts: {
              primaryContacts,
              secondaryContacts = [],
              notifyContacts = [],
            },
            monitoringData: {
              dropzone,
              machine,
              directory,
              minThreshold,
              maxThreshold,
              minSizeThresholdUnit,
              maxSizeThresholdUnit,
            },
          },
        } = monitoring;

        // If asr related the notification ID must be prefixed with the asr product short code
        let notificationPrefix = 'LZSU';
        if (asrSpecificMetaData?.domain) {
          try {
            const { productCategory } = asrSpecificMetaData;
            // Get product category
            const asrProduct = await AsrProduct.findOne({
              where: { id: productCategory },
              attributes: ['shortCode', 'name'],
              raw: true,
            });
            asrSpecificMetaData.productName = `${asrProduct.name} (${asrProduct.shortCode})`;
            notificationPrefix = asrProduct.shortCode;
          } catch (error) {
            parentPort.postMessage({
              level: 'warn',
              text: `Error while getting ASR product category: ${error.message}`,
            });
          }

          // Get Domain
          try {
            const asrDomain = await AsrDomain.findOne({
              where: { id: asrSpecificMetaData.domain },
              attributes: ['name'],
              raw: true,
            });
            asrSpecificMetaData.domainName = asrDomain.name;
          } catch (error) {
            parentPort.postMessage({
              level: 'warn',
              text: `Error while getting ASR domain: ${error.message}`,
            });
          }
        }

        let notificationId = generateNotificationId({
          notificationPrefix,
          timezoneOffset: uniqueClustersObj[clusterId].timezone_offset,
        });

        // Create violation description
        let violationDescription;
        if (violationType === 'below_minimum') {
          violationDescription = `Directory ${directory} has ${formatSize(totalSizeBytes, minSizeThresholdUnit)}, which is below the minimum threshold of ${minThreshold} ${minSizeThresholdUnit}`;
        } else {
          violationDescription = `Directory ${directory} has ${formatSize(totalSizeBytes, maxSizeThresholdUnit)}, which is above the maximum threshold of ${maxThreshold} ${maxSizeThresholdUnit}`;
        }

        // Issue object
        const issue = {
          'Issue Description': violationDescription,
          Cluster: uniqueClustersObj[clusterId].name,
          Dropzone: dropzone,
          Machine: machine,
          Directory: directory,
          'Current Size': formatSize(
            totalSizeBytes,
            violationType === 'below_minimum'
              ? minSizeThresholdUnit
              : maxSizeThresholdUnit
          ),
          'Minimum Threshold': `${minThreshold} ${minSizeThresholdUnit}`,
          'Maximum Threshold': `${maxThreshold} ${maxSizeThresholdUnit}`,
          'Violation Type':
            violationType === 'below_minimum'
              ? 'Below Minimum'
              : 'Above Maximum',
        };

        // Add to notification queue
        await NotificationQueue.create({
          type: 'email',
          notificationOrigin: monitoring_name,
          originationId: monitoringTypeId,
          deliveryType: 'immediate',
          templateName: 'lzSpaceUsageMonitoring',
          metaData: {
            notificationOrigin: monitoring_name,
            applicationId,
            notificationId,
            subject: `Space usage violation in ${directory}: ${formatSize(totalSizeBytes, violationType === 'below_minimum' ? minSizeThresholdUnit : maxSizeThresholdUnit)}`,
            mainRecipients: primaryContacts,
            cc: [...secondaryContacts, ...notifyContacts],
            notificationDescription: violationDescription,
            asrSpecificMetaData,
            issue,
            remedy: {
              instruction: `Check the directory ${directory} on ${machine} and ensure the space usage is within the expected range (${minThreshold} ${minSizeThresholdUnit} - ${maxThreshold} ${maxSizeThresholdUnit}).`,
            },
            firstLogged: findLocalDateTimeAtCluster(
              uniqueClustersObj[clusterId].timezone_offset
            ).toLocaleString(),
          },
          createdBy: 'System',
        });
      } catch (error) {
        parentPort.postMessage({
          level: 'error',
          text: `Error while queuing notification for space usage violation: ${error.message}`,
        });
      }
    }
  } catch (error) {
    // Log error
    parentPort.postMessage({
      level: 'error',
      text: `Error while monitoring landing zone for space usage: ${error.message}`,
    });
  } finally {
    // End time
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    parentPort.postMessage({
      level: 'info',
      text: `Landing Zone (space usage) Monitoring completed in ${duration} ms`,
    });
  }
})();
