const logger = require('../../config/logger');
const { parentPort } = require('worker_threads');
const {
  costMonitoring: CostMonitoring,
  costMonitoringData: CostMonitoringData,
  cluster: Cluster,
  monitoring_logs: MonitoringLogs,
  monitoring_types: MonitoringTypes,
} = require('../../models');
const { WorkunitsService } = require('@hpcc-js/comms');
const { getCluster } = require('../../utils/hpcc-util');
const { getClusterOptions } = require('../../utils/getClusterOptions');

/**
 * Gets the current time and time from lastScanTime, with optional timezone offset
 * @param {?string} lastScanTime
 * @param {number} [offset=0] - Timezone offset in minutes (e.g., 240 for UTC+4)
 * @param {boolean} [toIso=false] - Whether to return dates as ISO strings
 * @returns {{endTime: (Date|string), startTime: (Date|string), isNewDay: (boolean)}} Object containing current time and lastScanTime
 * with applied offset, either as Date objects or ISO strings based on toIso parameter
 */
function getStartAndEndTime(lastScanTime, offset = 0, toIso = false) {
  const now = new Date();
  const offsetMs = offset * 60 * 1000; // 240 minutes = 4 hours

  const nowWithOffset = new Date(now.getTime() + offsetMs);

  let startTime;
  let isNewDay = false;
  if (lastScanTime) {
    const lastScanWithOffset = new Date(
      new Date(lastScanTime).getTime() - offsetMs
    );
    isNewDay = lastScanWithOffset.getDate() !== nowWithOffset.getDate();

    if (isNewDay) {
      startTime = new Date(nowWithOffset);
      startTime.setHours(0, 0, 0, 0);
    } else {
      startTime = lastScanWithOffset;
    }
  } else {
    const oneHourMs = 60 * 60 * 1000;
    startTime = new Date(now.getTime() - oneHourMs + offsetMs);
  }

  if (toIso) {
    return {
      endTime: nowWithOffset.toISOString(),
      startTime: startTime.toISOString(),
      isNewDay,
    };
  }
  return {
    endTime: nowWithOffset,
    startTime,
    isNewDay,
  };
}

async function markOldData(costMonitoringId, clusterId, applicationId) {
  try {
    const costMonitoringData = await CostMonitoringData.findOne({
      where: { monitoringId: costMonitoringId, clusterId, applicationId },
    });
    if (!costMonitoringData) {
      return;
    }

    costMonitoringData.analyzed = true;
    costMonitoringData.save();
  } catch (err) {
    parentPort &&
      parentPort.postMessage({
        level: 'error',
        text: `monitorCostPerUser: Error in markOldData: ${err.message}`,
      });
  }
}

// TODO: Need a way to mark old data if not the start of day (isNewDay !== true)
async function getCostMonitoringData(
  monitoringId,
  clusterId,
  applicationId,
  monitoringDate
) {
  const [costMonitoringData, created] = await CostMonitoringData.findOrCreate({
    where: { monitoringId, applicationId, clusterId, analyzed: false },
    defaults: {
      monitoringId,
      applicationId,
      date: monitoringDate,
      clusterId,
      usersCostInfo: {},
      analyzed: false,
    },
  });
  return costMonitoringData;
}

/**
 * Handles the monitoring logs by either creating a new log entry or updating an existing one
 * @param {?import('../../models').monitoring_logs} inputMonitoringLog - The existing monitoring log entry or null if none exists
 * @param {number} clusterId - The ID of the cluster being monitored
 * @param {number} monitoringTypeId - The ID of the monitoring type
 * @param {Date} scanTime - The time when the work units were fetched
 * @returns {Promise<void>}
 */
async function handleMonitorLogs(
  inputMonitoringLog,
  clusterId,
  monitoringTypeId,
  scanTime
) {
  try {
    let monitoringLog = inputMonitoringLog;

    if (!monitoringLog) {
      await MonitoringLogs.create({
        cluster_id: clusterId,
        monitoring_type_id: monitoringTypeId,
        scan_time: scanTime,
        metaData: {},
      });
    } else {
      monitoringLog.scan_time = scanTime;
      await monitoringLog.save();
    }
  } catch (err) {
    logger.error(
      `handleMonitorLogs, failed to find/create monitoring log for costMonitoring, cluster ID: ${clusterId}, `,
      err
    );
    throw err;
  }
}

async function getCostMonitorings() {
  return await CostMonitoring.findAll({
    attributes: ['id', 'clusterIds', 'applicationId'],
    where: { isActive: true },
  });
}

async function monitorCostPerUser() {
  try {
    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: 'Cost Monitor Per user: Monitoring started ...',
      });

    // Check if there are any monitorings for cost per user
    const costMonitorings = await getCostMonitorings();
    if (costMonitorings.length === 0) {
      // TODO: Update run details
      parentPort &&
        parentPort.postMessage({
          level: 'info',
          text: 'No cost monitorings found',
        });
      return;
    }

    const monitoringType = await MonitoringTypes.findOne({
      where: { name: 'Cost Monitoring' },
    });

    // Get cluster details for each monitoring
    for (const costMonitor of costMonitorings) {
      const applicationId = costMonitor.applicationId;
      const clusterIds = costMonitor.clusterIds;

      let clusterDetails;
      if (clusterIds === null || clusterIds.length === 0) {
        // Then get all active clusters details
        // TODO: Maybe there's a better function for this, check the getAllClusters route
        const allClusters = Cluster.findAll({
          attributes: ['id'],
          where: { deletedAt: null },
        });
        clusterDetails = (
          await Promise.all(
            allClusters.map(async cluster => {
              try {
                return await getCluster(cluster.id);
              } catch (err) {
                parentPort &&
                  parentPort.postMessage({
                    level: 'error',
                    text: `monitorCostPerUser: Failed to get cluster ${cluster.name}: ${err.message}, ...skipping`,
                  });
              }
            })
          )
        ).filter(Boolean);
      } else {
        clusterDetails = (
          await Promise.all(
            clusterIds.map(async clusterId => {
              try {
                return await getCluster(clusterId);
              } catch (err) {
                parentPort &&
                  parentPort.postMessage({
                    level: 'error',
                    text: `monitorCostPerUser: Failed to get cluster ${clusterId}: ${err.message}, ...skipping`,
                  });
              }
            })
          )
        ).filter(Boolean);
      }

      // Iterate clusters
      for (const clusterDetail of clusterDetails) {
        try {
          let newScanTime;
          // spread timezone offset for each cluster and cluster details
          const {
            id: clusterId,
            thor_host: thorHost,
            thor_port: thorPort,
            username,
            hash,
            timezone_offset: timezoneOffset,
            allowSelfSigned,
          } = clusterDetail;

          // Check if a monitoring log exists
          const monitoringLog = await MonitoringLogs.findOne({
            where: {
              cluster_id: clusterId,
              monitoring_type_id: monitoringType.id,
            },
          });

          // Get start and end date
          const {
            nowWithOffset: endDate,
            hourAgoWithOffset: startDate,
            isNewDay,
          } = getStartAndEndTime(
            monitoringLog ? monitoringLog.scan_time : null,
            timezoneOffset,
            true
          );

          // NOTE: If making changes for daily, weekly, etc. Update this logic
          if (isNewDay) {
            await markOldData(costMonitor.id, clusterId, applicationId);
          }

          // Get costMonitoringData
          const costMonitoringData = await getCostMonitoringData(
            costMonitor.id,
            clusterId,
            applicationId,
            new Date()
          );

          // Get cluster options
          const clusterOptions = getClusterOptions(
            {
              baseUrl: `${thorHost}:${thorPort}`,
              userID: username || '',
              password: hash || '',
            },
            allowSelfSigned
          );

          // Set the new scanTime
          newScanTime = new Date();

          const connection = new WorkunitsService(clusterOptions);

          // Get work Units for the last hour where their state is terminal

          // Query for workunits during timeframe
          const response = await connection.WUQuery({
            StartDate: startDate,
            EndDate: endDate,
          });

          // Filter for failed or completed workunits
          const terminalWorkUnits =
            response.Workunits?.ECLWorkunit?.filter(
              workUnit =>
                workUnit.State === 'failed' || workUnit.State === 'completed'
            ) || [];

          // Iterate work Units
          terminalWorkUnits.forEach(
            ({ Owner, CompileCost, FileAccessCost, ExecuteCost }) => {
              if (!costMonitoringData.usersCostInfo[Owner]) {
                costMonitoringData.usersCostInfo[Owner] = {
                  compileCost: CompileCost,
                  fileAccessCost: FileAccessCost,
                  executeCost: ExecuteCost,
                };
                return;
              }

              costMonitoringData.usersCostInfo[Owner].compileCost +=
                CompileCost;
              costMonitoringData.usersCostInfo[Owner].executeCost +=
                ExecuteCost;
              costMonitoringData.usersCostInfo[Owner].fileAccessCost +=
                FileAccessCost;
            }
          );

          // Save costMonitoringData on each iteration
          await costMonitoringData.save();

          // If monitoring log doesn't exist create it. If it does update scan time
          await handleMonitorLogs(
            monitoringLog,
            clusterId,
            monitoringType.id,
            newScanTime
          );
        } catch (perClusterError) {
          parentPort &&
            parentPort.postMessage({
              level: 'error',
              text: `monitorCostPerUser: Failed in cluster ${clusterDetail.name}: ${perClusterError.message}, ...skipping`,
            });
        }
      }
    }
    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: 'Cost Monitor Per user: Monitoring Finished ...',
      });

    // Trigger the analyzeCostPerUser job
    if (parentPort) {
      parentPort.postMessage({
        action: 'trigger',
        type: 'monitor-cost-per-user',
      });
    }
  } catch (err) {
    parentPort &&
      parentPort.postMessage({
        level: 'error',
        text: `Cost Monitor Per user: ${err.message}`,
      });
  }
}

(async () => {
  await monitorCostPerUser();
})();
