const MONITORING_NAME = "Job Monitoring";
const { parentPort } = require("worker_threads");
const { WorkunitsService } = require("@hpcc-js/comms");

const logger = require("../../config/logger");
const models = require("../../models");
const { decryptString } = require("../../utils/cipher");
const {
  matchJobName,
  calculateRunOrCompleteByTimes,
  wuStartTimeWhenLastScanAvailable,
  wuStartTimeWhenLastScanUnavailable,
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

    // Find all active job monitorings.
    const jobMonitorings = await JobMonitoring.findAll({
      where: { isActive: 1, approvalStatus: "Approved" },
      raw: true,
    });

    /* if no job monitorings are found - return */
    if (jobMonitorings.length < 1) {
      logger.debug("No active job monitorings found.");
      return;
    }

    /* Organize job monitoring based on cluster ID. This approach simplifies interaction with 
    the HPCC cluster and minimizes the number of necessary API calls. */
    const jobMonitoringsByCluster = {};
    jobMonitorings.forEach((jobMonitoring) => {
      const clusterId = jobMonitoring.clusterId;

      if (!clusterId) {
        logger.error("Job monitoring missing cluster ID. Skipping...");
        return;
      }

      if (!jobMonitoringsByCluster[clusterId]) {
        jobMonitoringsByCluster[clusterId] = [jobMonitoring];
      } else {
        jobMonitoringsByCluster[clusterId].push(jobMonitoring);
      }
    });

    // Create array of unique cluster IDs
    const clusterIds = Object.keys(jobMonitoringsByCluster);

    // Get cluster info for all unique clusters
    const clustersInfo = await cluster.findAll({
      where: { id: clusterIds },
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
        logger.error(`Failed to decrypt hash for cluster ${clusterInfo.id}: ${error.message}` );
      }
    });

    // Get the last time the cluster was scanned for job monitoring purposes
    const lastClusterScanDetails = await monitoring_logs.findAll({
      where: { monitoring_type_id: monitoringTypeId, cluster_id: clusterIds },
      attributes: [
        "id",
        "cluster_id",
        "monitoring_type_id",
        "scan_time",
        "metaData",
      ],
      raw: true,
    });

    // Cluster  last scan info (Scan logs)
    clustersInfo.forEach((clusterInfo) => {
      const lastScanDetails = lastClusterScanDetails.find(
        (scanDetails) => scanDetails.cluster_id === clusterInfo.id
      );

      if (lastScanDetails) {
        clusterInfo.startTime = wuStartTimeWhenLastScanAvailable(lastScanDetails.scan_time,clusterInfo.timezone_offset);
      } else {
        clusterInfo.startTime = wuStartTimeWhenLastScanUnavailable(now,clusterInfo.timezone_offset,30);
      }
    });

    /* Fetch basic information for all work units per cluster, based on the timestamp of the last scan for job monitoring. 
    If no timestamp is available, default to data from the past 30 minutes. */
    const wuBasicInfoByCluster = {};
    for (let c in clustersInfo) {
      const clusterInfo = clustersInfo[c];

      try {
        const wuService = new WorkunitsService({
          baseUrl: `${clusterInfo.thor_host}:${clusterInfo.thor_port}/`,
          userID: clusterInfo.username || "",
          password: clusterInfo.password || "",
        });

  
        // Date to string
        const startTime = clusterInfo.startTime.toISOString();


        let {
          Workunits: { ECLWorkunit },
        } = await wuService.WUQuery({
          StartDate: startTime,
        });


        jobMonitoringsByCluster[clusterInfo.id].forEach((jobMonitoring) => {
          const jobNameFormat = jobMonitoring.jobName;

          ECLWorkunit = ECLWorkunit.filter((wu) => {
            return matchJobName(jobNameFormat, wu.Jobname);
          });

          if (wuBasicInfoByCluster[clusterInfo.id]){
            wuBasicInfoByCluster[clusterInfo.id] = wuBasicInfoByCluster[clusterInfo.id].concat(ECLWorkunit);
          }else{
            wuBasicInfoByCluster[clusterInfo.id] = ECLWorkunit;
          }
        });

      } catch (err) {
        logger.error( `Job monitoring - Error while reaching out to cluster ${clusterInfo.id} : ${err}`
        );
      }
    }

    // If no new workunits are found for any clusters, exit
    let newWorkUnitsFound = false;
    for(let keys in wuBasicInfoByCluster){
      if(wuBasicInfoByCluster[keys].length > 0){
        newWorkUnitsFound = true;
      }else{
        delete wuBasicInfoByCluster[keys];
      }
    }

    if (!newWorkUnitsFound) {
      logger.info("Job Monitoring - No new work units found for any clusters");
      return;
    }

    // Clusters with new work units - Done to minimize the number of calls to db later
    const clusterIdsWithNewWUs = Object.keys(wuBasicInfoByCluster);

    /* Iterate through each job monitoring. Compare the work unit state with the specified notification conditions. If conditions are met, 
    store details in notificationsToBeQueued. Identify monitorings that need updates and store them in jobMonitoringsToUpdate array. */
    const jobMonitoringsToUpdate = [];
    const notificationsToBeQueued = [];
    const wuInIntermediateState = [];

    jobMonitorings.forEach((monitoring) => {
      const {monitoringName,clusterId,jobName: jobNameOrPattern,id,metaData,} = monitoring;

      // If cluster has no new workunits, skip - reduces computation
      if (!clusterIdsWithNewWUs.includes(clusterId)) {
        return;
      }

      try{
        const cluster = clustersInfo.find((cluster) => cluster.id === clusterId);
        const {
          requireComplete,expectedStartTime,expectedCompletionTime,schedule,
          notificationMetaData: {
            notificationCondition = [],
            teamsHooks = [],
            notifyContacts = [],
            primaryContacts = [],
            secondaryContacts = [],
          },
        } = metaData;

        const clusterWUs = wuBasicInfoByCluster[clusterId];

        // Calculate the run window for the job
        const window = calculateRunOrCompleteByTimes({
          schedule,
          timezone_offset: cluster.timezone_offset,
          expectedStartTime,
          expectedCompletionTime,
        });

        /* If the schedule is not set for today, the run window will be null. 
        This indicates that the job is not scheduled to run today. Therefore return*/
        if (!window) { 
          return
        }
         
        // Iterate through each work unit and compare the state with the notification conditions etc
        clusterWUs.forEach((wu) => {
          try {
            const { Wuid, Jobname, State } = wu;

            // Workunit details
             const wuDetails = {
               jobMonitoringId: id,
               Jobname,
               jobNameFilter: jobNameOrPattern,
               Wuid,
               State,
               requireComplete,
               expectedStartTime: window.start,
               expectedCompletionTime: window.end,
               discoveredAt: now, // UTC time
               clusterId,
               notificationCondition,
             };

            // Change the state to lowercase
            const lowerCaseNotificationCondition = notificationCondition.map(
              (condition) => condition.toLowerCase()
            );

            const intermediateStates = ["submitted","compiling","running","wait",];
            const wuState = State.toLowerCase();

            // The state matches the condition (Failed, Aborted, Unknown))
            if (lowerCaseNotificationCondition.includes(wuState)) {
              notificationsToBeQueued.push({
                ...wuDetails,
                issue: `Analysis detected a monitored job in ${wuState} state`,
                teamsHooks,
                notifyContacts,
                primaryContacts,
                secondaryContacts,
                notificationOrigin: "Job Monitoring",
                templateName: "FailedJobNotification",
              });
            }

            // Else if the work unit is not in completed state and expectedCompletionTime is passed
            else if (intermediateStates.includes(wuState)) {
              // If a job is in waiting , compiling or other intermediate state, wu must be re-checked in another run
              wuInIntermediateState.push({
                ...wuDetails,  
                teamsHooks,
                notifyContacts,
                primaryContacts,
                secondaryContacts});
            }

            // Update jobmonitoring regardless of the state
            jobMonitoringsToUpdate.push(wuDetails);
          } catch (err) {
            logger.error( `Job monitoring - Err while inspecting ${wu.Jobname} workunit ${wu.Wuid} detail info : ${err.message}`);
          }
        });
      } catch (err) {
        logger.error(`Job monitoring. Looping job monitorings ${monitoringName}. id:  ${id}. ERR -  ${err.message}` );
      }
    });

    // Queue notifications
    try {
      await notification_queue.bulkCreate(notificationsToBeQueued);
    } catch (err) {
      logger.error(
        `Job monitoring - Error while queuing notifications : ${err.message}`
      );
    }

    // Get existing metaData from all monitoring logs
    const lastClusterScanMetaData = {};
    lastClusterScanDetails.forEach((detail) => {
      const { cluster_id, metaData } = detail;
      lastClusterScanMetaData[cluster_id] = metaData;
    });

    wuInIntermediateState.forEach((wu) => {
      const { clusterId } = wu;
      const existingMetaData = lastClusterScanMetaData[clusterId].metaData;
      const existingIntermediateStateWus = lastClusterScanMetaData[clusterId].metaData?.wuInIntermediateState || [];
      console.log("Existing ----", existingIntermediateStateWus)
      const allIntermediateStateWus = [...existingIntermediateStateWus, wu];
      lastClusterScanMetaData[clusterId] = {
        ...existingMetaData,
        wuInIntermediateState: allIntermediateStateWus,
      };
    });

    // Update/create lastClusterScanned data
    for (let id of clusterIds) {
      try {
        await monitoring_logs.upsert({
          cluster_id: id,
          monitoring_type_id: monitoringTypeId,
          scan_time: now,
          metaData: lastClusterScanMetaData[id] || {},
        });
      } catch (err) {
        logger.error(
          `Job monitoring - Error while updating last cluster scanned data for  cluster ${id} : ${err.message}`
        );
      }
    }

    // Update  job monitorings
    for (let jobMonitoring of jobMonitoringsToUpdate) {
      const { jobMonitoringId, Jobname, Wuid } = jobMonitoring;
      delete jobMonitoring.jobMonitoringId;
      try {
        await JobMonitoring.update({
          jobMonitoringId,
          lastJobRunDetails: jobMonitoring,
        }, {where : {id: jobMonitoringId }});
      } catch (err) {
        logger.error(
          `Job monitoring - Error  updating job monitoring- ${Jobname} workunit ${Wuid} : ${err.message}`
        );
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
