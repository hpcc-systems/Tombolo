const { parentPort, workerData } = require("worker_threads");
const { WorkunitsService } = require("@hpcc-js/comms");

const logger = require("../../config/logger");
const models = require("../../models");
const {decryptString} = require("../../utils/cipher");
const { matchJobName, findStartAndEndTimes } = require("./monitorJobsUtil");

const JobMonitoring = models.jobMonitoring;
const cluster = models.cluster;
const Monitoring_notifications = models.monitoring_notifications;

const os = require("os");
const { all } = require("axios");


(async () => {
  try {
    // -- Get all job monitorings that are active and approved --
    const jobMonitorings = await JobMonitoring.findAll({
      where: { isActive: 1, approvalStatus: "Approved" },
      raw: true,
    });

    //-- Separate job monitorings by cluster --
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

    // --Get unique cluster IDs --
    const clusterIds = Object.keys(jobMonitoringsByCluster);

    // --  Getting cluster info for all unique clusters --
    const clustersInfo = await cluster.findAll({
      where: { id: clusterIds },
      raw: true,
    });

    // Decrypting cluster passwords
    clustersInfo.forEach((clusterInfo) => {
      if (clusterInfo.hash) {
        clusterInfo.password = decryptString(clusterInfo.hash);
      } else {
        clusterInfo.password = null;
      }
    });

    // -- Get basic info for all workunits for each cluster  from last 30 minutes--
    const wuBasicInfoByCluster = {};
    for (let c in clustersInfo) {
      const clusterInfo = clustersInfo[c];

      const wuService = new WorkunitsService({
        baseUrl: `${clusterInfo.thor_host}:${clusterInfo.thor_port}/`,
        userID: clusterInfo.username || "",
        password: clusterInfo.password || "",
      });

      // Get the current time and subtract 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // TODO - This should be adjusted based on offset between tombolo server time and cluster time

      // Format the date in the expected format
      const formattedDate = thirtyMinutesAgo.toISOString();

      const {
        Workunits: { ECLWorkunit },
      } = await wuService.WUQuery({
        StartDate: formattedDate,
      });

      wuBasicInfoByCluster[clusterInfo.id] = ECLWorkunit;
    }


    // -- Get detailed info for all workunits for each cluster --
    const promises = [];
    Object.keys(wuBasicInfoByCluster).forEach((c) => {
      const c_info = clustersInfo.find((cluster) => cluster.id === c);
      const wuService = new WorkunitsService({
        baseUrl: `${c_info.thor_host}:${c_info.thor_port}`,
        userID: c_info.username || "",
        password: c_info.password || "",
      });

      wuBasicInfoByCluster[c].forEach((wu) => {
        const promise = wuService.WUInfo({
          Wuid: wu.Wuid,
          IncludeTimers: true,
        });
        promises.push({ promise, c });
      });
    });

    const promiseList = promises.map((p) => p.promise);
    const wuInfo = await Promise.all(promiseList);


    // -- Group detailed workunit info by cluster --
    const wuDetailInfo = {};
    wuInfo.forEach((info, index) => {
      const { c } = promises[index];
      if (wuDetailInfo[c]) {
        wuDetailInfo[c] = [...wuDetailInfo[c], info.Workunit];
      } else {
        wuDetailInfo[c] = [info.Workunit];
      }
    });

    // Update job monitoring for any work units that matched the name or pattern 
    const jobMonitoringsToUpdate = [];
    const notificationsToBeQueued = [];

    jobMonitorings.forEach((monitoring) => {
      const {clusterId,jobName: jobNameOrPattern,id, metaData} = monitoring;
      const {notificationMetaData : {
        notificationCondition=[], 
        teamsHooks = [], 
        notifyContacts=[], 
        primaryContacts=[], 
        secondaryContacts=[]}} = metaData; 

      const clusterWUs = wuDetailInfo[clusterId];

      if (!clusterWUs) {return;}

      clusterWUs.forEach((wu) => {
        const {
          Wuid,
          Jobname,
          State,
          Timers: { ECLTimer},
        } = wu;

        // Check if the job name matches the name or pattern
        if (matchJobName(jobNameOrPattern, Jobname)){
          // TODO - If a job is in waiting , compiling or other intermediate state, re-check on another run
          // Get wu compile time from timers and remove it from the object so less data is saved
          const { startTime, endTime } = findStartAndEndTimes(ECLTimer);
          delete wu.Timers;

          // Change the state to lowercase
          const lowerCaseNotificationCondition = notificationCondition.map(
            (condition) => condition.toLowerCase()
          );

          // The state matches the condition (Failed, Aborted, Unknown))
          if (lowerCaseNotificationCondition.includes(State.toLowerCase())) {
            notificationsToBeQueued.push({
              teamsHooks,
              notifyContacts,
              primaryContacts,
              secondaryContacts,
            });
          }
          // TODO - May be don't update if job is in intermediate state
          jobMonitoringsToUpdate.push({
            id,
            lastJobRunDetails: { ...wu, startTime, endTime },
          });
        }
      });

      //TODO - If job was not started with in the given window - Handle Here
      // Check when the job is expected to run based on schedule
      
      
    });

    // Update job monitorings with last job run details
    if (jobMonitoringsToUpdate.length > 0) {
     for(let j in jobMonitoringsToUpdate){
       const {id, lastJobRunDetails} = jobMonitoringsToUpdate[j];
       await JobMonitoring.update({lastJobRunDetails}, {where: {id}});
     }
     console.log('--- update complete ---')
    }

  } catch (err) {
    logger.error(err);
  } finally {
    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
  }
})();