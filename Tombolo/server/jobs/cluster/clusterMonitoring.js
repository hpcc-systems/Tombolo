// Library Imports
import axios from 'axios';
import _ from 'lodash';
import { logOrPostMessage } from '../jobUtils.js';
import { MachineService } from '@hpcc-js/comms';

// Local Imports
import {
  ClusterMonitoring,
  Cluster,
  MonitoringType,
  NotificationQueue,
  AsrProduct,
  AsrDomain,
  MonitoringLog,
} from '../../models.js';
import { generateNotificationId } from '../jobMonitoring/monitorJobsUtil.js';
import { decryptString } from '@tombolo/shared';
import { APPROVAL_STATUS } from '../../config/constants.js';

// Helper functions
async function enrichAsrMetaData(asrSpecificMetaData) {
  let notificationPrefix = 'CSM';
  if (asrSpecificMetaData?.domain) {
    try {
      const { productCategory } = asrSpecificMetaData;
      const asrProduct = await AsrProduct.findOne({
        where: { id: productCategory },
        attributes: ['shortCode', 'name'],
        raw: true,
      });
      asrSpecificMetaData.productName = `${asrProduct.name} (${asrProduct.shortCode})`;
      notificationPrefix = asrProduct.shortCode;
    } catch (error) {
      logOrPostMessage({
        level: 'warn',
        text: `Error while getting ASR product category: ${error.message}`,
      });
    }
    try {
      const asrDomain = await AsrDomain.findOne({
        where: { id: asrSpecificMetaData.domain },
        attributes: ['name'],
        raw: true,
      });
      asrSpecificMetaData.domainName = asrDomain.name;
    } catch (error) {
      logOrPostMessage({
        level: 'warn',
        text: `Error while getting ASR domain: ${error.message}`,
      });
    }
  }
  return { asrSpecificMetaData, notificationPrefix };
}

function getLocalTime(offset) {
  const newDate = new Date();
  return new Date(newDate.getTime() + offset * 60 * 1000).toLocaleString();
}

function extractClusterLists(response) {
  const lists = {
    thorClusterList: [],
    roxieClusterList: [],
    hThorClusterList: [],
  };
  if (response?.data?.ActivityResponse?.ThorClusterList) {
    const list = response.data.ActivityResponse.ThorClusterList.TargetCluster;
    lists.thorClusterList = list.map(cluster => ({
      ClusterName: cluster.ClusterName,
      ClusterStatus: _.capitalize(cluster.QueueStatus),
    }));
  }
  if (response?.data?.ActivityResponse?.RoxieClusterList) {
    const list = response.data.ActivityResponse.RoxieClusterList.TargetCluster;
    lists.roxieClusterList = list.map(cluster => ({
      ClusterName: cluster.ClusterName,
      ClusterStatus: _.capitalize(cluster.QueueStatus),
    }));
  }
  if (response?.data?.ActivityResponse?.HThorClusterList) {
    const list = response.data.ActivityResponse.HThorClusterList.TargetCluster;
    lists.hThorClusterList = list.map(cluster => ({
      ClusterName: cluster.ClusterName,
      ClusterStatus: _.capitalize(cluster.QueueStatus),
    }));
  }
  return lists;
}

function buildNotificationPayload({
  type = 'email',
  templateName,
  clusterId,
  metaData,
  subject,
  issue,
  mainRecipients = [],
  cc = [],
  asrSpecificMetaData,
  notificationId,
  clusterUrl,
  timezone_offset,
  createdBy = 'System',
}) {
  return {
    type,
    notificationOrigin: metaData.notificationOrigin,
    originationId: metaData.originationId,
    deliveryType: 'immediate',
    templateName,
    clusterId,
    metaData: {
      ...metaData,
      clusterUrl,
      notificationId,
      subject,
      mainRecipients,
      cc,
      notificationDescription: subject,
      asrSpecificMetaData,
      issue,
      firstLogged: getLocalTime(timezone_offset),
    },
    createdBy,
  };
}

const monitoring_name = 'Cluster Monitoring';
let monitoringTypeId;

async function monitorCluster() {
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
    logOrPostMessage({
      level: 'info',
      text: 'Cluster Status Monitoring started',
    });

    // Get all cluster status monitoring with isActive = true and approvalStatus = approved
    const activeClusterStatusMonitoring = await ClusterMonitoring.findAll({
      where: {
        isActive: true,
        approvalStatus: APPROVAL_STATUS.APPROVED,
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
      logOrPostMessage({
        level: 'info',
        text: 'No active cluster status monitoring found',
      });
      return;
    }

    // Change the cluster array to an object with cluster ID as key
    const clusterObject = {};
    activeClusterStatusMonitoring.forEach(monitoring => {
      let clusterPw = monitoring.cluster.hash
        ? decryptString(monitoring.cluster.hash, process.env.ENCRYPTION_KEY)
        : null;
      clusterObject[monitoring.cluster.id] = {
        ...monitoring.cluster,
        password: clusterPw,
        userID: monitoring.cluster.username,
        baseUrl: `${monitoring.cluster.thor_host}:${monitoring.cluster.thor_port}`,
      };
    });

    // Log the results
    logOrPostMessage({
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

    // Common notification payload metaData
    const commonMetaData = {
      instanceName: process.env.INSTANCE_NAME,
      notificationOrigin: monitoring_name,
      originationId: monitoringType.id,
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
          logOrPostMessage({
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

        const { thorClusterList, roxieClusterList, hThorClusterList } =
          extractClusterLists(response);

        // Iterate over list (thorClusterList, roxieClusterList, hThorClusterList) and check if any cluster is down
        const allClusters = [
          ...thorClusterList,
          ...roxieClusterList,
          ...hThorClusterList,
        ];
        const problematicClusters = allClusters.filter(
          cluster => cluster.ClusterStatus !== 'Active'
        );

        // If no problematic cluster found, log and continue to next monitoring
        if (problematicClusters.length === 0) {
          logOrPostMessage({
            level: 'verbose',
            text: `No problematic cluster found for ${clusterObject[clusterId].name}`,
          });
          continue;
        }

        // Log the problematic cluster count and cluster name
        logOrPostMessage({
          level: 'verbose',
          text: `Detected ${problematicClusters.length} problematic cluster(s) for ${clusterObject[clusterId].name}`,
        });

        // ASR MetaData
        const { asrSpecificMetaData: enrichedMeta, notificationPrefix } =
          await enrichAsrMetaData(asrSpecificMetaData);

        let notificationId = generateNotificationId({
          notificationPrefix,
          timezoneOffset: clusterObject[clusterId].timezone_offset,
        });

        const issueDescription = `${clusterObject[clusterId].name} has ${problematicClusters.length} cluster(s) in non-active state.`;
        const issue = {
          'Issue Description': issueDescription,
          'Problematic Clusters': problematicClusters,
        };

        const notificationPayload = buildNotificationPayload({
          templateName: 'clusterStatusMonitoring',
          clusterId,
          metaData: {
            ...commonMetaData,
            monitoringName: clusterStatusMonitoringName,
          },
          subject: issueDescription,
          issue,
          mainRecipients: primaryContacts,
          cc: [...secondaryContacts, ...notifyContacts],
          asrSpecificMetaData: enrichedMeta,
          notificationId,
          clusterUrl: clusterObject[clusterId].baseUrl,
          timezone_offset: clusterObject[clusterId].timezone_offset,
        });

        notificationToBeQueued.push(notificationPayload);
      } catch (error) {
        logOrPostMessage({
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
          logOrPostMessage({
            level: 'warn',
            text: `No usage data returned for cluster ID ${monitoring.clusterId}`,
          });
          continue;
        }

        // ASR MetaData
        const { asrSpecificMetaData: enrichedMeta, notificationPrefix } =
          await enrichAsrMetaData(asrSpecificMetaData);

        let notificationId = generateNotificationId({
          notificationPrefix,
          timezoneOffset: clusterObject[clusterId].timezone_offset,
        });

        const problematicEngines = [];
        res.forEach(r => {
          if (r.max > usageThreshold) {
            problematicEngines.push({
              Name: r.Name,
              Usage: `${r.max}%`,
              Threshold: `${usageThreshold}%`,
            });
          }
        });

        // If problematic engines found, queue notification
        if (problematicEngines.length > 0) {
          const subject = `${clusterObject[monitoring.clusterId].name} has some engine(s) above the usage threshold of ${usageThreshold}%.`;
          const issueDescription = `Cluster ${clusterObject[monitoring.clusterId].name} has the following engines that are above the usage threshold of ${usageThreshold}%.`;
          const issue = {
            'Issue Description': issueDescription,
            // Engine: r.Name,
            // Usage: `${r.max}%`,
            // Threshold: `${usageThreshold}%`,
            problematicEngines,
          };
          const notificationPayload = buildNotificationPayload({
            templateName: 'clusterUsageMonitoring',
            clusterId,
            metaData: {
              ...commonMetaData,
              monitoringName: monitoring.monitoringName,
              problematicEngines,
            },
            subject,
            issue,
            mainRecipients: contacts?.primaryContacts || [],
            cc: [
              ...(contacts?.secondaryContacts || []),
              ...(contacts?.notifyContacts || []),
            ],
            asrSpecificMetaData: enrichedMeta,
            notificationId,
            clusterUrl: clusterObject[monitoring.clusterId].baseUrl,
            timezone_offset:
              clusterObject[monitoring.clusterId].timezone_offset,
          });
          notificationToBeQueued.push(notificationPayload);
        }
      } catch (error) {
        logOrPostMessage({
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
              conflictFields: ['monitoring_type_id', 'cluster_id'],
            }
          );
        } catch (error) {
          logOrPostMessage({
            level: 'error',
            text: `Error while upserting monitoring log: ${error}`,
          });
        }
      }
    }
  } catch (error) {
    logOrPostMessage({
      level: 'error',
      text: `Error while monitoring cluster status: ${error}`,
    });
  } finally {
    // End time
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    logOrPostMessage({
      level: 'info',
      text: `Cluster Status Monitoring completed in ${duration} ms`,
    });
  }
}

(async () => {
  await monitorCluster();
})();

export { monitorCluster };
