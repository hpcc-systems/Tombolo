const MONITORING_NAME = "Job Monitoring";
const { parentPort } = require("worker_threads");
const { WorkunitsService, Attribute } = require("@hpcc-js/comms");
const fs = require("fs");

const logger = require("../../config/logger");
const models = require("../../models");
const { decryptString } = require("../../utils/cipher");
const {
  matchJobName,
  calculateRunOrCompleteByTimes,
  wuStartTimeWhenLastScanAvailable,
  wuStartTimeWhenLastScanUnavailable,
  findLocalDateTimeAtCluster,
  checkIfCurrentTimeIsWithinRunWindow,
} = require("./monitorJobsUtil");

const JobMonitoring = models.jobMonitoring;
const cluster = models.cluster;
const notification_queue = models.notification_queue;
const monitoring_types = models.monitoring_types;
const monitoring_logs = models.monitoring_logs;

(async () => {
  const now = new Date(); // UTC time

  try {
    // Get monitoring type ID for "Job Monitoring"
    const monitoringType = await monitoring_types.findOne({
      where: { name: MONITORING_NAME },
      raw: true,
    });

    // if monitoring type is not found, log error and exit
    if (!monitoringType) {
      throw new Error(
        `Monitoring type ${MONITORING_NAME} not found. possible rename or delete`
      );
    }
    // Job monitoring ID
    const monitoringTypeId = monitoringType.id;

    // Get all monitoring logs with monitoring type ID
    const monitoringLogs = await monitoring_logs.findAll({
      where: { monitoring_type_id: monitoringTypeId },
      raw: true,
    });

    // list of unique cluster IDs
    const clusterIds = [
      ...new Set(monitoringLogs.map((log) => log.cluster_id)),
    ];

    // Get cluster info for all unique clusters
    const clustersInfo = await cluster.findAll({
      where: { id: clusterIds },
      raw: true,
      attributes: ["id", "thor_host", "thor_port", "username", "hash", "timezone_offset"],
    });

    // Decrypt cluster passwords if they exist
    clustersInfo.forEach((clusterInfo) => {
      try {
        if (clusterInfo.hash) {
          clusterInfo.password = decryptString(clusterInfo.hash);
        } else {
          clusterInfo.password = null;
        }

        clusterInfo.localTime = findLocalDateTimeAtCluster(clusterInfo.timezone_offset).toISOString();
      } catch (error) {
        logger.error(
          `Failed to decrypt hash for cluster ${clusterInfo.id}: ${error.message}`
        );
      }
    });

    // Get array of monitoring logs which has the intermediate worUnits
    const monitoringsWithIntermediateStateWus = [];
    monitoringLogs.forEach((log) => {
      if(!log.metaData) return;
      const {metaData: { wuInIntermediateState }} = log;
      if (!wuInIntermediateState) return;
      monitoringsWithIntermediateStateWus.push(log);
    });


    // copy the array to avoid mutation
    const copyMonitoringsWithIntermediateStateWus = [...monitoringsWithIntermediateStateWus];

    const notificationsToBeQueued =[];
    const intermediateStates = ["submitted", "compiling", "running", "wait"];

    for(let [monitoringIndex  , monitoring] of monitoringsWithIntermediateStateWus.entries()){
      const {cluster_id} = monitoring;

      const cluster = clustersInfo.find((cluster) => cluster.id === cluster_id);

      try{
        const wuService = new WorkunitsService({
          baseUrl: `${cluster.thor_host}:${cluster.thor_port}/`,
          userID: cluster.username || "",
          password: cluster.password || "",
        });

        const {
          metaData: { wuInIntermediateState },
        } = monitoring;

        for (let wu of wuInIntermediateState) {
          const { notificationCondition, requireComplete } = wu;
          const notificationConditionLowerCase = notificationCondition.map(
            (condition) => condition.toLowerCase()
          );
          try {
            const info = await wuService.WUInfo({ Wuid: wu.Wuid });
            const {
              Workunit: { State },
            } = info;

            // Check if current time is before, after, within the window
            const currentTimeToWindowRelation =
              checkIfCurrentTimeIsWithinRunWindow({
                start: wu.expectedStartTime,
                end: wu.expectedCompletionTime,
                currentTime: cluster.localTime,
              });

            if (notificationConditionLowerCase.includes(State)) {
              //  States such as failed and aborted
              notificationsToBeQueued.push(wu);
             
            } else if (
              intermediateStates.includes(State) &&
              currentTimeToWindowRelation === "after"
            ) {
              // Still in intermediate state but window is passed
              console.log(
              );
                if (requireComplete === true) {
                  notificationsToBeQueued.push(wu);
                }
             
            } else if (intermediateStates.includes(State) && currentTimeToWindowRelation === "within") {
             
             
            }else{
              const a = copyMonitoringsWithIntermediateStateWus[monitoringIndex].metaData.wuInIntermediateState
              const i = a.findIndex((intermediateWu) => intermediateWu.Wuid === wu.Wuid);
              copyMonitoringsWithIntermediateStateWus[monitoringIndex].metaData.wuInIntermediateState.splice(i, 1);
            }

          } catch (err) {
            logger.error(
              `WUId - ${wu.Wuid} - Cluster ${cluster_id}: ${err.message}`
            );
          }
        }

        for(let item of copyMonitoringsWithIntermediateStateWus){
          await monitoring_logs.update(item, {where: { id: item.id}})
        }
        // fs.writeFileSync("intermediateJobs.js", JSON.stringify(copyMonitoringsWithIntermediateStateWus));
      }catch(err){
        logger.error(err);
      }
    }

  } catch (err) {
    logger.error(err);
  } finally {
    logger.debug(`Job monitoring completed started ${now} and ended at ${new Date()}`);
    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
  }
})();