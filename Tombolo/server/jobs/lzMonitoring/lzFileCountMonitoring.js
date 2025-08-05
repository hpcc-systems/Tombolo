const models = require('../../models');
const { parentPort } = require('worker_threads');
const { decryptString } = require('../../utils/cipher');
const { FileSprayService } = require('@hpcc-js/comms');
const { getClusterOptions } = require('../../utils/getClusterOptions');
const { generateNotificationId } = require('../jobMonitoring/monitorJobsUtil');
const {
  getFilesFromSingleLzDirectory,
  findLocalDateTimeAtCluster,
} = require('./lzFileMonitoringUtils');

const {
  landingZoneMonitoring: LandingZoneMonitoring,
  Cluster,
  monitoring_types: MonitoringTypes,
  notification_queue: NotificationQueue,
  AsrProduct,
  AsrDomain,
} = models;

const monitoring_name = 'Landing Zone Monitoring';

(async () => {
  // Get monitoring type ID for "Landing Zone Monitoring"
  const { id } = await MonitoringTypes.findOne({
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
      text: 'Landing Zone (file count) Monitoring started',
    });

    // Get all lz monitoring with isActive = true and approvalStatus = approved
    const activeLzMonitorings = await LandingZoneMonitoring.findAll({
      where: {
        isActive: true,
        approvalStatus: 'approved',
        lzMonitoringType: 'fileCount',
      },

      include: [
        {
          model: Cluster,
          required: true,
          attributes: [
            'id',
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
        text: 'No active landing zone (file count) monitoring found',
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
      text: `${activeLzMonitorings.length} active landing zone monitoring(s) tracking file count`,
    });

    // Create uniqueClustersObj for easy access
    const uniqueClustersObj = {};
    uniqueClusters.forEach(c => {
      uniqueClustersObj[c.id] = c;
    });

    // Array to store directories that violated thresholds
    const directoriesViolatingThreshold = [];

    // Iterate over activeLzMonitorings and check file counts
    for (const monitoring of activeLzMonitorings) {
      try {
        const {
          id: lzFileCountMonitoringId,
          clusterId,
          metaData: { monitoringData },
        } = monitoring;

        // Destructure monitoringData
        const { dropzone, machine, directory, minFileCount, maxFileCount } =
          monitoringData;

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

        // Get files from the single directory (non-recursive)
        const files = await getFilesFromSingleLzDirectory({
          lzFileMovementMonitoringId: lzFileCountMonitoringId,
          fss,
          DropZoneName: dropzone,
          Netaddr: machine,
          Path: directory,
          directoryOnly: false,
        });

        // Count only files (not directories)
        const fileCount = files.filter(f => !f.isDir).length;

        // Check if file count violates thresholds
        let violationType = null;
        if (fileCount < minFileCount) {
          violationType = 'below_minimum';
        } else if (fileCount > maxFileCount) {
          violationType = 'above_maximum';
        }

        if (violationType) {
          directoriesViolatingThreshold.push({
            lzFileCountMonitoringId,
            fileCount,
            violationType,
            monitoring,
          });
        }
      } catch (error) {
        parentPort.postMessage({
          level: 'error',
          text: `Error while getting file count from File Spray service: ${error.message}`,
        });
      }
    }

    // If no violations found, log and return
    if (directoriesViolatingThreshold.length === 0) {
      parentPort.postMessage({
        level: 'verbose',
        text: 'Landing zone (file count) monitoring did not find any directories violating file count thresholds',
      });
      return;
    }

    // Queue notification for each directory violating threshold
    parentPort.postMessage({
      level: 'info',
      text: `Queuing notification for ${directoriesViolatingThreshold.length} director(ies) violating file count thresholds`,
    });

    for (const violation of directoriesViolatingThreshold) {
      try {
        const { fileCount, violationType, monitoring } = violation;

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
              minFileCount,
              maxFileCount,
            },
          },
        } = monitoring;

        // If asr related the notification ID must be prefixed with the asr product short code
        let notificationPrefix = 'LZFC';
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
          violationDescription = `Directory ${directory} has ${fileCount} files, which is below the minimum threshold of ${minFileCount}`;
        } else {
          violationDescription = `Directory ${directory} has ${fileCount} files, which is above the maximum threshold of ${maxFileCount}`;
        }

        // Issue object
        const issue = {
          'Issue Description': violationDescription,
          Cluster: uniqueClustersObj[clusterId].name,
          Dropzone: dropzone,
          Machine: machine,
          Directory: directory,
          'Current File Count': fileCount,
          'Minimum Threshold': minFileCount,
          'Maximum Threshold': maxFileCount,
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
          templateName: 'lzFileCountMonitoring',
          metaData: {
            notificationOrigin: monitoring_name,
            applicationId,
            notificationId,
            subject: `File count violation in ${directory}: ${fileCount} files`,
            mainRecipients: primaryContacts,
            cc: [...secondaryContacts, ...notifyContacts],
            notificationDescription: violationDescription,
            asrSpecificMetaData,
            issue,
            remedy: {
              instruction: `Check the directory ${directory} on ${machine} and ensure the file count is within the expected range (${minFileCount}-${maxFileCount} files).`,
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
          text: `Error while queuing notification for file count violation: ${error.message}`,
        });
      }
    }
  } catch (error) {
    // Log error
    parentPort.postMessage({
      level: 'error',
      text: `Error while monitoring landing zone for file count: ${error.message}`,
    });
  } finally {
    // End time
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    parentPort.postMessage({
      level: 'info',
      text: `Landing Zone (file count) Monitoring completed in ${duration} ms`,
    });
  }
})();
