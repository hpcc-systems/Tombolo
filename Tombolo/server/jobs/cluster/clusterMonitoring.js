// Library Imports
const axios = require('axios');
const _ = require('lodash');
const { parentPort } = require('worker_threads');
const { MachineService } = require('@hpcc-js/comms');

// Local Imports
const {
  ClusterMonitoring,
  Cluster,
  MonitoringType,
  NotificationQueue,
  AsrProduct,
  AsrDomain,
  MonitoringLog,
} = require('../../models');
const { generateNotificationId } = require('../jobMonitoring/monitorJobsUtil');
const { decryptString } = require('../../utils/cipher');

const monitoring_name = 'Cluster Monitoring';
let monitoringTypeId;

(async () => {
  const startTime = new Date().getTime();

  try {
    // Get monitoring type ID for "Cluster Status Monitoring"
    const monitoringType = await MonitoringType.findOne({
      where: { name: monitoring_name },
      raw: true,
    });
    if (!monitoringType) {
      throw new Error(`Monitoring type ${monitoring_name} not found.`);
    }
    monitoringTypeId = monitoringType.id;

    // Start time
    parentPort.postMessage({
      level: 'info',
      text: 'Cluster Status Monitoring started',
    });

    // Get all cluster status monitoring with isActive = true and approvalStatus = approved
    const activeClusterStatusMonitoring = await ClusterMonitoring.findAll({
      where: {
        isActive: true,
        approvalStatus: 'approved',
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

    // If no active monitoring found, log and exit
    if (activeClusterStatusMonitoring.length === 0) {
      parentPort.postMessage({
        level: 'info',
        text: 'No active cluster status monitoring found',
      });
      return;
    }

    // Change the cluster array to an object with cluster ID as key
    const clusterObject = {};
    activeClusterStatusMonitoring.forEach(monitoring => {
      let clusterPw = monitoring.cluster.hash
        ? decryptString(monitoring.cluster.hash)
        : null;
      clusterObject[monitoring.cluster.id] = {
        ...monitoring.cluster,
        password: clusterPw,
        userID: monitoring.cluster.username,
        baseUrl: `${monitoring.cluster.thor_host}:${monitoring.cluster.thor_port}`,
      };
    });

    // Log the results
    parentPort.postMessage({
      level: 'info',
      text: `Found ${activeClusterStatusMonitoring.length} active cluster status monitoring(s)`,
    });

    // Separate monitoring by clusterMonitoringType [["status", "usage"]]
    const monitoringTrackingUsage = [];
    const monitoringTrackingStatus = [];

    activeClusterStatusMonitoring.forEach(monitoring => {
      if (monitoring.clusterMonitoringType.includes('status')) {
        monitoringTrackingStatus.push(monitoring);
      }
      if (monitoring.clusterMonitoringType.includes('usage')) {
        monitoringTrackingUsage.push(monitoring);
      }
    });

    // Common notification payload
    const commonPayload = {
      type: 'email',
      notificationOrigin: monitoring_name,
      originationId: monitoringType.id,
      deliveryType: 'immediate',
      metaData: {
        instanceName: process.env.INSTANCE_NAME,
        notificationOrigin: monitoring_name,
      },
      createdBy: 'System',
    };

    const notificationToBeQueued = [];

    // Iterate over monitoring tracking cluster status and make async calls to check the status of the cluster
    for (const monitoring of monitoringTrackingStatus) {
      try {
        const {
          id,
          monitoringName: clusterStatusMonitoringName,
          clusterId,
          metaData = {},
        } = monitoring;
        const { contacts = {}, asrSpecificMetaData = {} } = metaData;
        const {
          primaryContacts = [],
          secondaryContacts = [],
          notifyContacts = [],
        } = contacts;
        const cluster = clusterObject[clusterId];
        if (!cluster) {
          parentPort.postMessage({
            level: 'error',
            text: `Cluster not found for monitoring ID ${id}`,
          });
          continue;
        }

        const response = await axios.post(
          `${cluster.baseUrl}/WsSMC/Activity.json`,
          new URLSearchParams({
            ver_: '1.27',
          }).toString(),
          {
            auth: {
              username: cluster.userID,
              password: cluster.password,
            },
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
          }
        );

        let thorClusterList = [];
        let roxieClusterList = [];
        let hThorClusterList = [];
        if (response?.data?.ActivityResponse?.ThorClusterList) {
          const list =
            response.data.ActivityResponse.ThorClusterList.TargetCluster;
          thorClusterList = list.map(cluster => ({
            ClusterName: cluster.ClusterName,
            ClusterStatus: _.capitalize(cluster.QueueStatus),
          }));
        }

        if (response?.data?.ActivityResponse?.RoxieClusterList) {
          const list =
            response.data.ActivityResponse.RoxieClusterList.TargetCluster;
          roxieClusterList = list.map(cluster => ({
            ClusterName: cluster.ClusterName,
            ClusterStatus: _.capitalize(cluster.QueueStatus),
          }));
        }

        if (response?.data?.ActivityResponse?.HThorClusterList) {
          const list =
            response.data.ActivityResponse.HThorClusterList.TargetCluster;
          hThorClusterList = list.map(cluster => ({
            ClusterName: cluster.ClusterName,
            ClusterStatus: _.capitalize(cluster.QueueStatus),
          }));
        }

        // Iterate over list (thorClusterList, roxieClusterList, hThorClusterList) and check if any cluster is down
        const allClusters = [
          ...thorClusterList,
          ...roxieClusterList,
          ...hThorClusterList,
        ];
        const problematicClusters = allClusters.filter(
          cluster => cluster.ClusterStatus !== 'Active' // Change this to 1 to trigger  notification for tests
        );

        // If no problematic cluster found, log and continue to next monitoring
        if (problematicClusters.length === 0) {
          parentPort.postMessage({
            level: 'verbose',
            text: `No problematic cluster found for ${clusterObject[clusterId].name}`,
          });
          continue;
        }

        // Log the problematic cluster count and cluster name
        parentPort.postMessage({
          level: 'verbose',
          text: `Detected ${problematicClusters.length} problematic cluster(s) for ${clusterObject[clusterId].name}`,
        });

        // If asr related the notification ID must be prefixed with the asr product short code
        let notificationPrefix = 'CSM';
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
          timezoneOffset: clusterObject[clusterId].timezone_offset,
        });

        const issueDescription = `${clusterObject[clusterId].name} has ${problematicClusters.length} cluster(s) in non-active state.`; // Issue object
        const issue = {
          'Issue Description': issueDescription,
          'Problematic Clusters': problematicClusters,
        };

        // Time at the cluster
        const newDate = new Date();
        const localTime = new Date(
          newDate.getTime() +
            clusterObject[clusterId].timezone_offset * 60 * 1000
        );

        const notificationPayload = {
          type: 'email',
          notificationOrigin: monitoring_name,
          originationId: monitoringType.id,
          deliveryType: 'immediate',
          templateName: 'clusterStatusMonitoring',
          clusterId,
          metaData: {
            instanceName: process.env.INSTANCE_NAME,
            monitoringName: clusterStatusMonitoringName,
            notificationOrigin: monitoring_name,
            clusterUrl: clusterObject[clusterId].baseUrl,
            notificationId,
            subject: issueDescription,
            mainRecipients: primaryContacts,
            cc: [...secondaryContacts, ...notifyContacts],
            notificationDescription: issueDescription,
            asrSpecificMetaData,
            issue,
            firstLogged: localTime.toLocaleString(),
          },
          createdBy: 'System',
        };

        notificationToBeQueued.push(notificationPayload);
      } catch (error) {
        parentPort.postMessage({
          level: 'error',
          text: `Error while monitoring cluster status: ${error}`,
        });
      }
    }

    // iterate over monitoring tracking cluster usage and make async calls to check the usage of the cluster
    for (const monitoring of monitoringTrackingUsage) {
      try {
        const { metaData = {}, clusterId } = monitoring;
        const {
          contacts = {},
          asrSpecificMetaData = {},
          monitoringDetails = {},
        } = metaData;
        const { usageThreshold } = monitoringDetails;
        const ms = new MachineService(clusterObject[monitoring.clusterId]);
        const res = await ms.GetTargetClusterUsageEx();

        if (res.length < 1) {
          parentPort.postMessage({
            level: 'warn',
            text: `No usage data returned for cluster ID ${monitoring.clusterId}`,
          });
          continue;
        }

        // -------------------------------------------------
        // If asr related the notification ID must be prefixed with the asr product short code
        let notificationPrefix = 'CSM';
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
          timezoneOffset: clusterObject[clusterId].timezone_offset,
        });
        // -------------------------------------------------

        res.forEach(r => {
          if (r.max > usageThreshold) {
            console.log('------------------------');
            console.log('Queue this one : ', r.max, r.Name, usageThreshold);
            console.log('------------------------');

            // ---------------
            // Time at the cluster
            const newDate = new Date();
            const localTime = new Date(
              newDate.getTime() +
                clusterObject[clusterId].timezone_offset * 60 * 1000
            );

            // ---------------

            const notificationPayload = {
              ...commonPayload,
              templateName: 'clusterUsageMonitoring',
              clusterId,
              metaData: {
                ...commonPayload.metaData,
                monitoringName: monitoring.monitoringName,
                notificationOrigin: monitoring_name,
                clusterUrl: clusterObject[monitoring.clusterId].baseUrl,
                notificationId,
                subject: `${clusterObject[monitoring.clusterId].name} is at ${r.max}% capacity`,
                mainRecipients: contacts?.primaryContacts || [],
                cc: [
                  ...(contacts?.secondaryContacts || []),
                  ...(contacts?.notifyContacts || []),
                ],
                notificationDescription: `Cluster ${clusterObject[monitoring.clusterId].name} is at ${r.max}% capacity which is above the threshold of ${usageThreshold}%.`,
                asrSpecificMetaData,
                issue: {
                  'Issue Description': `Cluster ${clusterObject[monitoring.clusterId].name} is at ${r.max}% capacity which is above the threshold of ${usageThreshold}%.`,
                  Resource: r.Name,
                  Usage: `${r.max}%`,
                  Threshold: `${usageThreshold}%`,
                },
                firstLogged: localTime.toLocaleString(),
              },
            };

            //-------------
            notificationToBeQueued.push(notificationPayload);
          }
        });
      } catch (error) {
        parentPort.postMessage({
          level: 'error',
          text: `Error while monitoring cluster usage: ${error}`,
        });
      }

      // Queue notification that are to be sent
      await NotificationQueue.bulkCreate(notificationToBeQueued);

      // Iterate over the notificationToBeQueued and do upsert
      for (const n of notificationToBeQueued) {
        try {
          await MonitoringLog.upsert(
            {
              monitoring_type_id: monitoringTypeId,
              cluster_id: n.clusterId,
              scan_time: new Date(),
            },
            {
              // Add unique constraint fields to the upsert object
              conflictFields: ['monitoring_type_id', 'cluster_id'],
            }
          );
        } catch (error) {
          parentPort.postMessage({
            level: 'error',
            text: `Error while upserting monitoring log: ${error}`,
          });
        }
      }
    }
  } catch (error) {
    parentPort.postMessage({
      level: 'error',
      text: `Error while monitoring cluster status: ${error}`,
    });
  } finally {
    // End time
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    parentPort.postMessage({
      level: 'info',
      text: `Cluster Status Monitoring completed in ${duration} ms`,
    });
  }
})();
