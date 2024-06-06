const { parentPort } = require("worker_threads");
const { WorkunitsService } = require("@hpcc-js/comms");


const logger = require("../../config/logger");
const models = require("../../models");
const { decryptString } = require("../../utils/cipher");
const {
  matchJobName,
  wuStartTimeWhenLastScanAvailable,
  wuStartTimeWhenLastScanUnavailable,
  calculateRunOrCompleteByTimes,
  createNotificationPayload,
  nocAlertData,
  createNocNotificationPayload,
  checkIfCurrentTimeIsWithinRunWindow,
  findLocalDateTimeAtCluster,
  intermediateStates,
} = require("./monitorJobsUtil");

const JobMonitoring = models.jobMonitoring;
const cluster = models.cluster;
const monitoring_logs = models.monitoring_logs;
const monitoring_types = models.monitoring_types;
const notification_queue = models.notification_queue;
const MONITORING_NAME = "Job Monitoring";


(async() =>{
  const now = new Date(); // UTC time

  try {
    logger.verbose("Started job monitoring script ....");

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

    // Find all active job monitorings.
    const jobMonitorings = await JobMonitoring.findAll({
      where: { isActive: 1, approvalStatus: "Approved" },
      raw: true,
    });

    /* if no job monitorings are found - return */
    if (jobMonitorings.length < 1) {
      logger.verbose(
        "No active job monitorings found, ending job monitoring script ...."
      );
      return;
    }

    /* Organize job monitoring based on cluster ID. This approach simplifies interaction with 
         the HPCC cluster and minimizes the number of necessary API calls. */
    const jobMonitoringsByCluster = {};
    jobMonitorings.forEach((jobMonitoring) => {
      const clusterId = jobMonitoring.clusterId;
      try {
        if (!jobMonitoringsByCluster[clusterId]) {
          jobMonitoringsByCluster[clusterId] = [jobMonitoring];
        } else {
          jobMonitoringsByCluster[clusterId].push(jobMonitoring);
        }
      } catch (err) {
        logger.error(
          `Error organizing job monitoring by cluster for JM with id : ${jobMonitoring.id}: ${err}`
        );
      }
    });

    // List of unique clusters Ids
    let uniqueClusters = Object.keys(jobMonitoringsByCluster);

    // Get cluster info for all unique clusters
    const clustersInfo = await cluster.findAll({
      where: { id: uniqueClusters },
      raw: true,
    });

    // Decrypt cluster passwords if they exist
    clustersInfo.forEach((clusterInfo) => {
      try {
        if (clusterInfo.hash) {
          clusterInfo.password = decryptString(clusterInfo.hash);
        } else {
          clusterInfo.password = null;
        }
      } catch (error) {
        logger.error(
          `Failed to decrypt hash for cluster ${clusterInfo.id}: ${error.message}`
        );
      }
    });

    // Get the last time the cluster was scanned and scanned details
    logger.verbose("Getting monitoring logs  ....");
    const lastClusterScanDetails = await monitoring_logs.findAll({
      where: {
        monitoring_type_id: monitoringTypeId,
        cluster_id: uniqueClusters,
      },
      raw: true,
    });

    // Cluster  last scan info (Scan logs)
    clustersInfo.forEach((clusterInfo, index) => {
      const lastScanDetails = lastClusterScanDetails.find(
        (scanDetails) => scanDetails.cluster_id === clusterInfo.id
      );

      if (lastScanDetails) {
        clusterInfo.startTime = wuStartTimeWhenLastScanAvailable(
          lastScanDetails.scan_time,
          clusterInfo.timezone_offset
        );
      } else {
        clusterInfo.startTime = wuStartTimeWhenLastScanUnavailable(
          now,
          clusterInfo.timezone_offset,
          30
        );
      }
    });

    /* Fetch basic information for all work units per cluster, based on the timestamp of the last scan for job monitoring. 
        If no timestamp is available, default to data from the past 30 minutes. */
    logger.verbose("Fetching new wu basic info from each unique clusters ....");
    const wuBasicInfoByCluster = {};
    for (let c of clustersInfo) {
      const wuService = new WorkunitsService({
        baseUrl: `${c.thor_host}:${c.thor_port}/`,
        userID: c.username || "",
        password: c.password || "",
      });

      // Date to string
      const startTime = c.startTime.toISOString();

      const {
        Workunits: { ECLWorkunit },
      } = await wuService.WUQuery({
        StartDate: startTime,
      });

      wuBasicInfoByCluster[c.id] = ECLWorkunit;
    }

    // If no new workunits are found for any clusters, exit
    let newWorkUnitsFound = false;
    for (let key in wuBasicInfoByCluster) {
      if (wuBasicInfoByCluster[key].length > 0) {
        newWorkUnitsFound = true;
      } else {
        delete wuBasicInfoByCluster[key];
      }
    }

    // If no new monitoring work units are found, update the monitoring logs and exit
    if (!newWorkUnitsFound) {
      logger.verbose(
        "JM - No new  units found for any clusters, updating scan time ..."
      );
      for (let id of uniqueClusters) {
        try {
          await monitoring_logs.upsert({
            cluster_id: id,
            monitoring_type_id: monitoringTypeId,
            scan_time: now,
          });
        } catch (err) {
          logger.error(
            `JM - Error while updating last cluster scanned time stamp`
          );
        }
      }
      return;
    }
    logger.verbose(`Job monitoring found new  jobs`);

    const clustersWithNewWus = Object.keys(wuBasicInfoByCluster);

    // Keep only clusters with new workunits
    uniqueClusters.forEach((clusterId) => {
      if (!clustersWithNewWus.includes(clusterId)) {
        delete jobMonitoringsByCluster[clusterId];
      }
    });

    // All JM with potential matching workunits
    const suspectedJMs = [];
    for (key in jobMonitoringsByCluster) {
      suspectedJMs.push(...jobMonitoringsByCluster[key]);
    }

    // Iterate over JM with potential matching workunits
    const jobMonitoringWithNotifications = [];
    const wuInIntermediateStates = [];
    for (let monitoring of suspectedJMs) {
      const {
        monitoringName,
        clusterId,
        jobName: jobNameOrPattern,
        id,
        metaData,
        applicationId,
      } = monitoring;
      try {
        const cluster = clustersInfo.find(
          (cluster) => cluster.id === clusterId
        );
        const {
          requireComplete,
          expectedStartTime,
          expectedCompletionTime,
          schedule,
          notificationMetaData: {
            notificationCondition = [],
            teamsHooks = [],
            notifyContacts = [],
            primaryContacts = [],
            secondaryContacts = [],
          },
        } = metaData;

        // Calculate the run window for the job
        const window = calculateRunOrCompleteByTimes({
          schedule,
          timezone_offset: cluster.timezone_offset,
          expectedStartTime,
          expectedCompletionTime,
        });

        // If the JM is monitoring a job that is not within the run window, skip
        if (!window) {
          suspectedJMs.splice(suspectedJMs.indexOf(monitoring), 1);
          return;
        }

        // New workunits for the current cluster
        const clusterWUs = wuBasicInfoByCluster[clusterId];

        clusterWUs.forEach((wu) => {
          try {
            const jobNameMatched = matchJobName(jobNameOrPattern, wu.Jobname);

            // If it the workunit is unrelated to the job monitoring, skip
            if (!jobNameMatched) {
              return;
            }

            // Change the state to lowercase
            const lowerCaseNotificationCondition = notificationCondition.map(
              (condition) => condition.toLowerCase()
            );

            // The state matches the condition (Failed, Aborted, Unknown))
            const wuState = wu.State.toLowerCase();

            // Check if the current time is within the run window
            const currentTimeToWindowRelation =
              checkIfCurrentTimeIsWithinRunWindow({
                start: window.start,
                end: window.end,
                currentTime: window.currentTime
              });

            // The state matches the condition (Failed, Aborted, Unknown))
            const wuDetails = {
              ...wu,
              ...metaData,
              teamsHooks,
              notifyContacts,
              primaryContacts,
              secondaryContacts,
              jobMonitoringId: id,
              requireComplete,
              monitoringName,
              applicationId,
              expectedStartTime: window.start,
              expectedCompletionTime: window.end,
              notificationOrigin: "Job Monitoring",
            };
            if (lowerCaseNotificationCondition.includes(wuState)) {
              wuDetails.notificationDescription = `Analysis detected a monitored job in ${wu.State} state`;
              jobMonitoringWithNotifications.push({ wu: wuDetails, cluster });
            } // Else if expected time is passed, job is not completed but is required to be completed
            else if (
              currentTimeToWindowRelation === "after" &&
              requireComplete &&
              wuState !== "completed"
            ) {
              logger.verbose(
                `Expected to run at ( ${wuDetails.expectedCompletionTime} ) passed for ${wu.Jobname} - ${wu.Wuid} - in ${wuState} state.`
              );
              wuDetails.notificationDescription = `Analysis detected a monitored job that was expected to complete by ${wuDetails.expectedCompletionTime} but is still in ${wu.State} state`;
              jobMonitoringWithNotifications.push({ wu: wuDetails, cluster });
            } else if (intermediateStates.includes(wuState)) {
              wuInIntermediateStates.push(
                {...wuDetails, 
                  ...wuDetails?.asrSpecificMetaData, 
                  ...wuDetails?.notificationMetaData,  
                  clusterId: cluster.id});
            }
          } catch (err) {
            logger.error(
              `JM - Error while checking ${wu.Wuid} : ${clusterId}: ${monitoring.id}: ${err}`
            );
          }
        });
      } catch (err) {
        logger.error(
          `JM - Error while processing JM with id : ${monitoring.id} : ${err}`
        );
      }
    }

    // Queue notifications
    const notificationToBeQueued = [];
    for (let jobMonitoring of jobMonitoringWithNotifications) {
      try {
        const emailNotificationPayload = await createNotificationPayload({
          ...jobMonitoring,
          type: "email",
        });
        notificationToBeQueued.push(emailNotificationPayload);

        if (jobMonitoring.wu?.notificationMetaData?.teamsHooks.length > 0) {
          const teamsNotificationPayload = await createNotificationPayload({
            ...jobMonitoring,
            type: "msTeams",
          });
          notificationToBeQueued.push(teamsNotificationPayload);
        }

        const nocData = await nocAlertData({
          application_id: jobMonitoring.wu?.applicationId,
          severity: jobMonitoring.wu?.asrSpecificMetaData?.severity,
        });

        if (nocData.triggerNocAlert) {
          const nocNotificationPayload = await createNocNotificationPayload({
            wu: jobMonitoring.wu,
            nocData,
          });
          notificationToBeQueued.push(nocNotificationPayload);
        }
      } catch (err) {
        logger.error(
          `JM - Error while queuing notification for JM with id : ${jobMonitoring.wu.jobMonitoringId}: ${err}`
        );
      }
    }
    try {
      await await notification_queue.bulkCreate(notificationToBeQueued);
    } catch (err) {
      logger.error(
        `JM - Error while adding notification to the notification queue table: ${err} : notification_queue`
      );
    }

    // Get existing metaData from all monitoring logs
    const lastClusterScanMetaData = {};
    lastClusterScanDetails.forEach((detail) => {
      const { cluster_id, metaData } = detail;
      lastClusterScanMetaData[cluster_id] = metaData;
    });


    wuInIntermediateStates.forEach((w) => {  
      console.log('-------------------wwww------------------');
      console.dir(w.clusterId, { depth: null });
      console.log('------------------------------------------');   
      const existingMetaData = lastClusterScanMetaData[w.clusterId];
      const existingIntermediateStateWus =
        existingMetaData?.wuInIntermediateState || [];
      const allIntermediateStateWus = [...existingIntermediateStateWus, w];
      lastClusterScanMetaData[w.clusterId] = {
        ...existingMetaData,
        wuInIntermediateState: allIntermediateStateWus,
      };
    });

// console.log("------- lastClusterScanMetaData ----------");
// console.dir(lastClusterScanMetaData);
// console.log('------------------------------------------');

    // Update all monitoring logs that has monitoring_type_id of job monitoring and cluster id in uniqueClusters
    logger.verbose("Updating monitoring logs ....");
    for (let id of uniqueClusters) {
      // console.log(
      //   "======================= Here 1",
      //   lastClusterScanMetaData[id]
      // );
      try {
        await monitoring_logs.upsert({
          cluster_id: id,
          monitoring_type_id: monitoringTypeId,
          scan_time: now,
          metaData: lastClusterScanMetaData[id] || {},
        });
      } catch (err) {
        logger.error(
          `JM - Error while updating last cluster scanned time stamp: ${err}`
        );
      }
    }
  } catch (err) {
    logger.error(err);
  } finally {
    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
  }
})();