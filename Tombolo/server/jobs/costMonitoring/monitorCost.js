const logger = require('../../config/logger');
const { parentPort } = require('worker_threads');
const { logOrPostMessage } = require('../jobUtils');
const {
  CostMonitoring,
  CostMonitoringData,
  MonitoringLog,
  MonitoringType,
} = require('../../models');
const { Workunit } = require('@hpcc-js/comms');
const { getClusters } = require('../../utils/hpcc-util');
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
    logOrPostMessage({
      level: 'info',
      text: 'Cost Monitor Per user: Monitoring started ...',
    });

    // Check if there are any monitorings for cost per user
    const costMonitorings = await getCostMonitorings();
    if (costMonitorings.length === 0) {
      logOrPostMessage({
        level: 'info',
        text: 'No cost monitorings found',
      });
      return;
    }

    const monitoringType = await MonitoringType.findOne({
      where: { name: 'Cost Monitoring' },
    });

    if (!monitoringType) {
      logOrPostMessage({
        level: 'error',
        text: 'monitorCost: MonitoringType, "Cost Monitoring" not found',
      });
      return;
    }

    // 1. Gather all unique cluster IDs referenced by any cost monitoring (or all clusters if any monitoring has clusterIds null/empty)
    let allClusterIds = new Set();
    for (const costMonitor of costMonitorings) {
      costMonitor.clusterIds.forEach(id => allClusterIds.add(id));
    }

    const clusterDetails = await getClusters(Array.from(allClusterIds));

    // 2. For each cluster, aggregate all cost monitoring data into a single CostMonitoringData row
    for (const clusterDetail of clusterDetails) {
      const clusterId = clusterDetail.id;
      // TODO: Call logOrPost here
      // Check if the cluster had an errors during getClusters
      if ('error' in clusterDetail) {
        parentPort &&
          parentPort.postMessage({
            level: 'error',
            text: `monitorCost: Failed to get cluster ${clusterId}: ${clusterDetail.error}, ...skipping`,
          });
        continue;
      }
      try {
        const {
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
        const newScanTime = new Date();

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

        // Aggregate cost data for this cluster
        const usersCostInfo = {};
        const metaData = {
          wuCostData: {},
          clusterCostData: {
            compileCost: 0,
            executeCost: 0,
            fileAccessCost: 0,
            totalCost: 0,
          },
        };

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

            if (!metaData.wuCostData[Wuid]) {
              metaData.wuCostData[Wuid] = {
                jobName: Jobname,
                owner: Owner,
                compileCost: CompileCost,
                executeCost: ExecuteCost,
                fileAccessCost: FileAccessCost,
                totalCost: CompileCost + ExecuteCost + FileAccessCost,
              };
            }

            if (!usersCostInfo[Owner]) {
              usersCostInfo[Owner] = {
                compileCost: 0,
                executeCost: 0,
                fileAccessCost: 0,
                totalCost: 0,
              };
            }

            usersCostInfo[Owner].compileCost += CompileCost;
            usersCostInfo[Owner].executeCost += ExecuteCost;
            usersCostInfo[Owner].fileAccessCost += FileAccessCost;
            usersCostInfo[Owner].totalCost +=
              CompileCost + ExecuteCost + FileAccessCost;

            metaData.clusterCostData.compileCost += CompileCost;
            metaData.clusterCostData.executeCost += ExecuteCost;
            metaData.clusterCostData.fileAccessCost += FileAccessCost;
            metaData.clusterCostData.totalCost +=
              CompileCost + ExecuteCost + FileAccessCost;
          }
        );

        // Save a single CostMonitoringData row per cluster
        await CostMonitoringData.create({
          date: new Date(),
          clusterId,
          usersCostInfo,
          metaData,
        });

        // If monitoring log doesn't exist create it. If it does update scan time
        await handleMonitorLogs(
          monitoringLog,
          clusterId,
          monitoringType.id,
          newScanTime
        );
      } catch (perClusterError) {
        logger.error('>>> monitorCost: Error in cluster ', perClusterError);
        logOrPostMessage({
          level: 'error',
          text: `monitorCost: Failed in cluster ${clusterId}: ${perClusterError.message}, ...skipping`,
        });
      }
    }
    logOrPostMessage({
      level: 'info',
      text: 'Cost Monitor Per user: Monitoring Finished ...',
    });

    // Trigger the analyzeCost job
    if (parentPort) {
      parentPort.postMessage({
        action: 'trigger',
        type: 'monitor-cost',
      });
    } else {
      logOrPostMessage({
        level: 'error',
        text: 'Failed to trigger monitor cost, parentPort is nullish',
      });
    }
  } catch (err) {
    logOrPostMessage({
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
