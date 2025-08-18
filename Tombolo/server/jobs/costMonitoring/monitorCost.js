const logger = require('../../config/logger');
const { parentPort } = require('worker_threads');
const {
  CostMonitoring,
  CostMonitoringData,
  Cluster,
  MonitoringLog,
  MonitoringType,
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

async function markDataAnalyzed(costMonitoringId, clusterId, applicationId) {
  try {
    const costMonitoringData = await CostMonitoringData.findOne({
      where: { monitoringId: costMonitoringId, clusterId, applicationId },
    });
    if (!costMonitoringData) {
      return;
    }

    costMonitoringData.analyzed = true;
    await costMonitoringData.save();
  } catch (err) {
    parentPort &&
      parentPort.postMessage({
        level: 'error',
        text: `monitorCost: Error in markDataAnalyzed: ${err.message}`,
      });
  }
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
          const {
            endTime: endDate,
            startTime: startDate,
            isNewDay,
          } = getStartAndEndTime(
            monitoringLog ? monitoringLog.scan_time : null,
            timezoneOffset,
            true
          );

          logger.info('>>>>>>> startDate', startDate);
          logger.info('>>>>>>> endDate', endDate);

          // NOTE: If making changes for daily, weekly, etc. Update this logic
          if (isNewDay) {
            await markDataAnalyzed(costMonitor.id, clusterId, applicationId);
          }

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

          // logger.info(
          //   '>>>>>>> response',
          //   JSON.stringify(response.Workunits?.ECLWorkunit, null, 2)
          // );

          // Filter for failed or completed workunits
          const terminalWorkUnits =
            response.Workunits?.ECLWorkunit?.filter(
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
              if (!costMonitoringData.hasOwnProperty('metaData'))
                costMonitoringData.metaData = {};
              if (!costMonitoringData.metaData.hasOwnProperty('wuCostData'))
                costMonitoringData.metaData.wuCostData = {};
              if (!costMonitoringData.metaData.wuCostData.hasOwnProperty(Wuid))
                costMonitoringData.metaData.wuCostData[Wuid] = {
                  jobName: '',
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
          await CostMonitoringData.create({ ...costMonitoringData });

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
