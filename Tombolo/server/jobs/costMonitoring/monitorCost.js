const logger = require('../../config/logger');
const { parentPort } = require('worker_threads');
const {
  CostMonitoring,
  CostMonitoringData,
  Cluster,
  MonitoringLog,
  MonitoringType,
} = require('../../models');
const { Workunit } = require('@hpcc-js/comms');
const { getCluster } = require('../../utils/hpcc-util');
const { getClusterOptions } = require('../../utils/getClusterOptions');

/**
 * Gets the current time and time from lastScanTime in UTC without applying any timezone conversions.
 * The input and output are treated strictly as UTC.
 * @param {?string} lastScanTime - An ISO timestamp string in UTC or null.
 * @param {number} [offset=0] - Deprecated. Ignored to ensure UTC-in/UTC-out behavior.
 * @param {boolean} [toIso=false] - Whether to return dates as ISO strings.
 * @returns {{endTime: (Date|string), startTime: (Date|string), isNewDay: (boolean)}}
 */
function getStartAndEndTime(lastScanTime, offset = 0, toIso = false) {
  // Always operate in UTC; do not apply any timezone offset.
  const nowUtc = new Date();

  let startUtc;
  let isNewDay = false;

  if (lastScanTime) {
    const lastUtc = new Date(lastScanTime);

    // Compare UTC calendar dates
    isNewDay =
      lastUtc.getUTCFullYear() !== nowUtc.getUTCFullYear() ||
      lastUtc.getUTCMonth() !== nowUtc.getUTCMonth() ||
      lastUtc.getUTCDate() !== nowUtc.getUTCDate();

    if (isNewDay) {
      // Start at UTC midnight of the current day
      startUtc = new Date(
        Date.UTC(
          nowUtc.getUTCFullYear(),
          nowUtc.getUTCMonth(),
          nowUtc.getUTCDate(),
          0,
          0,
          0,
          0
        )
      );
    } else {
      startUtc = lastUtc;
    }
  } else {
    // First run: start from UTC midnight today
    startUtc = new Date(
      Date.UTC(
        nowUtc.getUTCFullYear(),
        nowUtc.getUTCMonth(),
        nowUtc.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );
  }

  const endUtc = nowUtc;

  if (toIso) {
    return {
      endTime: endUtc.toISOString(),
      startTime: startUtc.toISOString(),
      isNewDay,
    };
  }
  return {
    endTime: endUtc,
    startTime: startUtc,
    isNewDay,
  };
}

/**
 * Handles the monitoring logs by either creating a new log entry or updating an existing one
 * @param {?import('../../models').MonitoringLog} inputMonitoringLog - The existing monitoring log entry or null if none exists
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
      await MonitoringLog.create({
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

async function monitorCost() {
  try {
    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: 'Cost Monitor Per user: Monitoring started ...',
      });

    // Check if there are any monitorings for cost per user
    const costMonitorings = await getCostMonitorings();
    if (costMonitorings.length === 0) {
      parentPort &&
        parentPort.postMessage({
          level: 'info',
          text: 'No cost monitorings found',
        });
      return;
    }

    const monitoringType = await MonitoringType.findOne({
      where: { name: 'Cost Monitoring' },
    });

    if (!monitoringType) {
      if (parentPort) {
        parentPort.postMessage({
          level: 'error',
          text: 'monitorCost: MonitoringType, "Cost Monitoring" not found',
        });
      } else {
        logger.error(
          'monitorCost: MonitoringType, "Cost Monitoring" not found'
        );
      }
      return;
    }

    // Get cluster details for each monitoring
    for (const costMonitor of costMonitorings) {
      const applicationId = costMonitor.applicationId;
      const clusterIds = costMonitor.clusterIds;

      let clusterDetails;
      if (clusterIds === null || clusterIds.length === 0) {
        // Then get all active clusters details
        const allClusters = await Cluster.findAll({
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
                    text: `monitorCost: Failed to get cluster ${cluster.name}: ${err.message}, ...skipping`,
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
                    text: `monitorCost: Failed to get cluster ${clusterId}: ${err.message}, ...skipping`,
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
          const monitoringLog = await MonitoringLog.findOne({
            where: {
              cluster_id: clusterId,
              monitoring_type_id: monitoringType.id,
            },
          });

          // Get start and end date
          const { endTime: endDate, startTime: startDate } = getStartAndEndTime(
            monitoringLog ? monitoringLog.scan_time : null,
            timezoneOffset,
            true
          );

          // Get costMonitoringData
          const costMonitoringData = {
            monitoringId: costMonitor.id,
            applicationId,
            date: new Date(),
            clusterId,
            usersCostInfo: {},
            metaData: {},
            analyzed: false,
          };

          // Get cluster options
          const clusterOptions = getClusterOptions(
            {
              baseUrl: `${thorHost}:${thorPort}`,
              userID: username || '',
              password: hash || '',
              timeoutSecs: 180,
            },
            allowSelfSigned
          );

          // Set the new scanTime
          newScanTime = new Date();

          // Get work Units for the last hour where their state is terminal

          // Query for workunits during timeframe
          const response = await Workunit.query(clusterOptions, {
            StartDate: startDate,
            EndDate: endDate,
            PageSize: 99999, // Ensure we get all workunits
          });

          const terminalWorkUnits =
            response.filter(
              workUnit =>
                workUnit.State === 'failed' || workUnit.State === 'completed'
            ) || [];

          // Iterate work Units
          terminalWorkUnits.forEach(
            ({
              Owner,
              CompileCost,
              FileAccessCost,
              ExecuteCost,
              Wuid,
              Jobname,
            }) => {
              // Ensure the costs are a number and not null/undefined
              CompileCost = CompileCost ?? 0;
              FileAccessCost = FileAccessCost ?? 0;
              ExecuteCost = ExecuteCost ?? 0;

              // Ensure expected fields are present in costMonitoringData for JSON fields
              if (!costMonitoringData.hasOwnProperty('metaData'))
                costMonitoringData.metaData = {};
              if (!costMonitoringData.metaData.hasOwnProperty('wuCostData'))
                costMonitoringData.metaData.wuCostData = {};
              if (!costMonitoringData.metaData.wuCostData.hasOwnProperty(Wuid))
                costMonitoringData.metaData.wuCostData[Wuid] = {
                  jobName: '',
                  owner: '',
                  compileCost: 0,
                  executeCost: 0,
                  fileAccessCost: 0,
                  totalCost: 0,
                };
              if (!costMonitoringData.usersCostInfo.hasOwnProperty(Owner))
                costMonitoringData.usersCostInfo[Owner] = {
                  compileCost: 0,
                  executeCost: 0,
                  fileAccessCost: 0,
                  totalCost: 0,
                };

              if (
                !costMonitoringData.metaData.hasOwnProperty('clusterCostData')
              )
                costMonitoringData.metaData.clusterCostData = {
                  compileCost: 0,
                  executeCost: 0,
                  fileAccessCost: 0,
                  totalCost: 0,
                };

              const totalCost = CompileCost + ExecuteCost + FileAccessCost;

              // Set clusterCostData to aggregate cost for all workunits
              costMonitoringData.metaData.clusterCostData.fileAccessCost +=
                FileAccessCost;
              costMonitoringData.metaData.clusterCostData.compileCost +=
                CompileCost;
              costMonitoringData.metaData.clusterCostData.executeCost +=
                ExecuteCost;
              costMonitoringData.metaData.clusterCostData.totalCost +=
                totalCost;

              // Set wuCostData for specific workunit
              costMonitoringData.metaData.wuCostData[Wuid].jobName = Jobname;
              costMonitoringData.metaData.wuCostData[Wuid].owner = Owner;
              costMonitoringData.metaData.wuCostData[Wuid].compileCost =
                CompileCost;
              costMonitoringData.metaData.wuCostData[Wuid].executeCost =
                ExecuteCost;
              costMonitoringData.metaData.wuCostData[Wuid].fileAccessCost =
                FileAccessCost;
              costMonitoringData.metaData.wuCostData[Wuid].totalCost =
                totalCost;

              // Set userCostInfo for a specific user
              costMonitoringData.usersCostInfo[Owner].compileCost +=
                CompileCost;
              costMonitoringData.usersCostInfo[Owner].executeCost +=
                ExecuteCost;
              costMonitoringData.usersCostInfo[Owner].fileAccessCost +=
                FileAccessCost;
              costMonitoringData.usersCostInfo[Owner].totalCost += totalCost;
            }
          );

          // Save costMonitoringData on each iteration
          await CostMonitoringData.create(costMonitoringData);

          // If monitoring log doesn't exist create it. If it does update scan time
          await handleMonitorLogs(
            monitoringLog,
            clusterId,
            monitoringType.id,
            newScanTime
          );
        } catch (perClusterError) {
          logger.error('>>> monitorCost: Error in cluster ', perClusterError);
          parentPort &&
            parentPort.postMessage({
              level: 'error',
              text: `monitorCost: Failed in cluster ${clusterDetail.name}: ${perClusterError.message}, ...skipping`,
            });
        }
      }
    }
    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: 'Cost Monitor Per user: Monitoring Finished ...',
      });

    // Trigger the analyzeCost job
    if (parentPort) {
      parentPort.postMessage({
        action: 'trigger',
        type: 'monitor-cost',
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
  await monitorCost();
})();

module.exports = {
  getStartAndEndTime,
  handleMonitorLogs,
  getCostMonitorings,
  monitorCost,
};
