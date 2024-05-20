const MONITORING_NAME = "Job Monitoring";
const { parentPort } = require("worker_threads");
const { WorkunitsService } = require("@hpcc-js/comms");
const fs = require("fs");
const _ = require("lodash");

// Local imports
const logger = require("../../config/logger");
const models = require("../../models");
const { decryptString } = require("../../utils/cipher");

const {
  findLocalDateTimeAtCluster,
  checkIfCurrentTimeIsWithinRunWindow,
  intermediateStates,
  generateNotificationId,
  adjustedLocaleString,
  createNotificationPayload
} = require("./monitorJobsUtil");

// Constants
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

    // Get all monitoring logs with monitoring type ID ie - job monitoring
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
      attributes: [
        "id",
        "thor_host",
        "thor_port",
        "username",
        "hash",
        "timezone_offset",
      ],
    });

    // Decrypt cluster passwords if they exist
    clustersInfo.forEach((clusterInfo) => {
      try {
        if (clusterInfo.hash) {
          clusterInfo.password = decryptString(clusterInfo.hash);
        } else {
          clusterInfo.password = null;
        }

        clusterInfo.localTime = findLocalDateTimeAtCluster(
          clusterInfo.timezone_offset
        ).toISOString();
      } catch (error) {
        logger.error(
          `Failed to decrypt hash for cluster ${clusterInfo.id}: ${error.message}`
        );
      }
    });

    // Get array of monitoring logs which has the intermediate worUnits
    const monitoringsWithIntermediateStateWus = [];

    monitoringLogs.forEach((log) => {
      if (!log.metaData) return;
      const {
        metaData: { wuInIntermediateState },
      } = log;
      if (!wuInIntermediateState) return;
      monitoringsWithIntermediateStateWus.push(log);
    });

    // copy the array to avoid mutation
    const copyMonitoringsWithIntermediateStateWus = [
      ...monitoringsWithIntermediateStateWus,
    ];

    const notificationsToBeQueued = [];
    const wuNoLongerInIntermediateState = [];
    const wuWithNewIntermediateState = {};

    for (let [
      monitoringIndex,
      monitoring,
    ] of monitoringsWithIntermediateStateWus.entries()) {
      const { cluster_id } = monitoring;

      const cluster = clustersInfo.find((cluster) => cluster.id === cluster_id);

      try {
        // create a new instance of WorkunitsService
        const wuService = new WorkunitsService({
          baseUrl: `${cluster.thor_host}:${cluster.thor_port}/`,
          userID: cluster.username || "",
          password: cluster.password || "",
        });

        const {
          metaData: { wuInIntermediateState },
        } = monitoring;

        // Iterate through all the intermediate state WUs
        for (let wu of wuInIntermediateState) {
          const { notificationCondition, requireComplete } = wu;

          // Notification condition in lower case. ex - failed, aborted, completed
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

          
            // WU now in state such as failed, aborted etc
            if (notificationConditionLowerCase.includes(State)) {
              // Add new State to the WU
              wu.State = _.capitalize(State);
              wu.notificationDescription = `Analysis detected a monitored job in ${State} state`;

              // notification object
              const emailNotification = await createNotificationPayload({wu, cluster,type: "email",});

              notificationsToBeQueued.push(emailNotification);

              // If teams hook is provided, add another notification to the queue
              if (wu.teamsHooks) {
                const teamsNotification = await createNotificationPayload({wu,cluster,type: "msTeams",});
                notificationsToBeQueued.push(teamsNotification);
              }
            }
            // Still in intermediate state but window is passed an the job is required to be completed
            else if (
              intermediateStates.includes(State) &&
              currentTimeToWindowRelation === "after" &&
              requireComplete === true
            ) {
              // Add new State to the WU
              wu.State = _.capitalize(State);
              wu.notificationDescription = `Analysis detected a monitored job that was expected to complete by ${wu.expectedCompletionTime} but is still in ${State} state`;

              // notification object
              const emailNotification = await createNotificationPayload({wu, cluster, type: "email"});
            
              notificationsToBeQueued.push(emailNotification);

              // If teams hook is provided, add another notification to the queue
              if (wu.teamsHooks) {
                const teamsNotification = await createNotificationPayload({ wu, cluster, type: "msTeams"});
                notificationsToBeQueued.push(teamsNotification);
              }
            }
            // IF the job is still in intermediate state and the current time is within the run  window
            else if (
              intermediateStates.includes(State) &&
              currentTimeToWindowRelation === "within"
            ) {
              // If the State has changed from last time it was checked, update monitoring needs to be updated with new state
              if (wu.State !== State) {
               wuWithNewIntermediateState[wu.Wuid] = State;
              }
            } else {
              // WU in completed state - Remove the WU from the intermediate state
              wuNoLongerInIntermediateState.push(wu.Wuid);
            }
          } catch (err) {
            logger.error(
              `WUId - ${wu.Wuid} - Cluster ${cluster_id}: ${err.message}`
            );
          }
        }

        // Update the monitoring logs
        for (let item of copyMonitoringsWithIntermediateStateWus) {
          await monitoring_logs.update(item, { where: { id: item.id } });
        }
      } catch (err) {
        logger.error(err);
      }
    }

    // Insert notification in queue
    for (let notification of notificationsToBeQueued) {
      await notification_queue.create(notification);
      wuNoLongerInIntermediateState.push(notification.wuId);
    }

    // if wuNoLongerInIntermediateState is empty, or state of intermediate wu has not changed return
    if (wuNoLongerInIntermediateState.length === 0 && Object.keys(wuWithNewIntermediateState).length === 0)  {
      logger.debug("Intermediate state job Monitoring -  No WU to remove from intermediate state and no intermediate workunit with updated state Exiting...");
      return;
    }

    //Remove wu that are not longer in intermediate state.
    for (let log of monitoringLogs) {
      try {
        const { id, metaData } = log;
        const { wuInIntermediateState = [] } = metaData;
        const wuStillInIntermediateState = wuInIntermediateState.filter(
          (wu) => !wuNoLongerInIntermediateState.includes(wu.Wuid)
        );


        // If state of intermediate WU has changed, update
        for (let wu of wuStillInIntermediateState) {
          if (wuWithNewIntermediateState[wu.Wuid]) {
            wu.State = wuWithNewIntermediateState[wu.Wuid];
          }
        }

        // copy existingMetadata and update wuInIntermediateState and update the monitoring log
        const existingMetadata = { ...metaData };
        existingMetadata.wuInIntermediateState = wuStillInIntermediateState;
        await monitoring_logs.update(
          { metaData: existingMetadata },
          { where: { id } }
        );
      } catch (error) {
        console.error(`Error updating log with id ${log.id}:`, error);
      }
    }
  } catch (err) {
    logger.error(err);
  } finally {
    logger.debug(
      `Job monitoring completed started ${now} and ended at ${new Date()}`
    );
    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
  }
})();
