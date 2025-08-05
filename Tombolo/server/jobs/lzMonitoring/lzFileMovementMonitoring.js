const models = require('../../models');
const { parentPort } = require('worker_threads');
const { decryptString } = require('../../utils/cipher');
const { FileSprayService } = require('@hpcc-js/comms');
const { getClusterOptions } = require('../../utils/getClusterOptions');
// const path = require('path');
const { generateNotificationId } = require('../jobMonitoring/monitorJobsUtil');
const {
  getFilesFromLandingZoneRecursivly,
  findLocalDateTimeAtCluster,
} = require('./lzFileMonitoringUtils');

const {
  landingZoneMonitoring: LandingZoneMonitoring,
  cluster: Cluster,
  monitoring_types: MonitoringTypes,
  notification_queue: NotificationQueue,
  AsrProduct,
  AsrDomain,
} = models;

const monitoring_name = 'Landing Zone Monitoring';

(async () => {
  // Get monitoring type ID for "Job Monitoring"
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
      text: 'Landing Zone (file movement) Monitoring started',
    });

    // Get all lz monitoring with isActive = true and approvalStatus = approved
    const activeLzMonitorings = await LandingZoneMonitoring.findAll({
      where: {
        isActive: true,
        approvalStatus: 'approved',
        lzMonitoringType: 'fileMovement',
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
        text: 'No active landing zone (file movement) monitoring found',
      });
      return;
    }

    // Iterate over activeLzMonitorings, if none of them are lzMonitoringType = 'fileMovement' log and return
    const uniqueClusters = [];
    activeLzMonitorings.forEach(lzMonitoring => {
      // Iterate over uniqueCluster arry and make sure lzMonitoring.clusterId is unique in there
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
      level: 'verobse',
      text: `${activeLzMonitorings.length} active landing zone monitoring(s) tracking file movement`,
    });

    // create uniqueClustersObj for easy access
    const uniqueClustersObj = {};
    uniqueClusters.forEach(c => {
      uniqueClustersObj[c.id] = c;
    });

    // Iterate over activeLzMonitorings and make async place holder calls
    const allMatchedFiles = [];
    const filesThatPassedThreshold = [];

    for (const monitoring of activeLzMonitorings) {
      try {
        const {
          id: lzFileMovementMonitoringId,
          clusterId,
          metaData: { monitoringData },
        } = monitoring;

        // Destructure monitoringData further
        const { dropzone, machine, directory, maxDepth, fileName } =
          monitoringData;

        // Get all the files in the directory plus all subdirectories until maxDepth
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

        const matches = await getFilesFromLandingZoneRecursivly({
          lzFileMovementMonitoringId,
          depth: maxDepth,
          fss,
          DropZoneName: dropzone,
          Netaddr: machine,
          Path: directory,
          directoryOnly: false,
          fileNameToMatch: fileName,
        });

        allMatchedFiles.push(...matches);
      } catch (error) {
        parentPort.postMessage({
          level: 'error',
          text: `Error while getting files from File Spray service: ${error.message}`,
        });
      }
    }

    // If no files found, log and return
    if (allMatchedFiles.length === 0) {
      parentPort.postMessage({
        level: 'verbose',
        text: 'Landing zone (file movement) monitoring did not find any matching file in specified landing zones',
      });
      return;
    }

    // For ease of access, create lzFileMovementMonitoringAsObj with id
    const lzFileMovementMonitoringAsObj = {};
    activeLzMonitorings.forEach(lzMonitoring => {
      lzFileMovementMonitoringAsObj[lzMonitoring.id] = lzMonitoring;
    });

    // Iterate over allMatchedFiles and evaluate whether the file has passed the threshold
    for (let f of allMatchedFiles) {
      const { lzFileMovementMonitoringId, modifiedtime } = f;
      const cid =
        lzFileMovementMonitoringAsObj[lzFileMovementMonitoringId].clusterId;
      const threshold =
        lzFileMovementMonitoringAsObj[lzFileMovementMonitoringId].metaData
          .monitoringData.threshold;
      const clusterOffset = uniqueClustersObj[cid].timezone_offset;
      const localTimeAtCluster = findLocalDateTimeAtCluster(clusterOffset);
      // compute age of file in ms and compare to threshold (minutes)
      const fileDate = new Date(modifiedtime);
      const ageMs = localTimeAtCluster - fileDate;
      const thresholdMs = threshold * 60 * 1000;
      if (ageMs > thresholdMs) {
        filesThatPassedThreshold.push({
          ...f,
          ageInMins: Math.round(ageMs / 60000, 0),
        });
      }
    }

    // If FilesThatPassedThreshold is empty, log and return
    if (filesThatPassedThreshold.length === 0) {
      parentPort.postMessage({
        level: 'verbose',
        text: 'Landing zone (file movement) monitoring did not find any file that passed the threshold',
      });
      return;
    }
    // Queue notification for each file that passed the threshold
    parentPort.postMessage({
      level: 'info',
      text: `Queing notification for ${filesThatPassedThreshold.length} file(s) that passed the threshold`,
    });

    for (const file of filesThatPassedThreshold) {
      try {
        const {
          name: fileName,
          lzFileMovementMonitoringId,
          ageInMins,
          Path: directory,
          modifiedtime,
        } = file;

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
            monitoringData: { dropzone, machine, threshold },
          },
        } = lzFileMovementMonitoringAsObj[lzFileMovementMonitoringId];

        // If asr related the notification ID must be prefixed with the asr product short code
        let notificationPrefix = 'LZFM';
        if (asrSpecificMetaData?.domain) {
          try {
            const { productCategory } = asrSpecificMetaData;
            // Geet product category
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

        // issue object
        const issue = {
          'Issue Description': `File ${fileName} is stuck at ${directory} for ${ageInMins} minutes`,
          Cluster: uniqueClustersObj[clusterId].name,
          Dropzone: dropzone,
          Machine: machine,
          Directory: directory,
          'File Modified Time': modifiedtime,
          Threshold: `${threshold} minutes`,
          'File Age': `${ageInMins} minutes`,
        };

        // Add to notification queue
        await NotificationQueue.create({
          type: 'email',
          notificationOrigin: monitoring_name,
          originationId: monitoringTypeId,
          deliveryType: 'immediate',
          templateName: 'lzFileMovementMonitoring',
          metaData: {
            notificationOrigin: monitoring_name,
            applicationId,
            notificationId,
            subject: `${fileName} is stuck at ${directory} for ${ageInMins} minutes`,
            mainRecipients: primaryContacts,
            cc: [...secondaryContacts, ...notifyContacts],
            notificationDescription: `File ${fileName} is stuck at ${directory} for ${ageInMins} minutes. The maximum threshold is ${threshold} minutes.`,
            asrSpecificMetaData,
            issue,
            remedy: {
              instruction: `Check the file ${fileName} at ${directory} on ${machine} and ensure it is processed or removed from the landing zone.`,
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
          text: `Error while queuing notification for file ${file.fileName}: ${error.message}`,
        });
      }
    }
  } catch (error) {
    // Log error
    parentPort.postMessage({
      level: 'error',
      text: `Error while monitoring landing zone for file movement: ${error.message}`,
    });
  } finally {
    // End time
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    parentPort.postMessage({
      level: 'info',
      text: `Landing Zone (file movement) Monitoring completed in ${duration} ms`,
    });
  }
})();
