const { parentPort, workerData } = require("worker_threads");
const { WorkunitsService } = require("@hpcc-js/comms");

const logger = require("../../config/logger");
const models = require("../../models");
const {decryptString} = require("../../utils/cipher");
const {matchJobName} = require("./monitorJobsUtil");

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
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // TODO - this should come from the database

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

    // Workunits that match the name or pattern of job from job monitoring, needs to be updated
    const jobMonitoringsToUpdate = [];
    const notifications = [];
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
        const { Wuid, Jobname, State } = wu;
        console.log("-- Job name and pattern --", Jobname, jobNameOrPattern);
        //TODO -  Ignore if last run wuid is === to the current wuid

        // Check if the job name matches the name or pattern
        if (matchJobName(jobNameOrPattern, Jobname)){
          console.log('--- wu job name matched with monitoring job name ---')
          jobMonitoringsToUpdate.push({ id, lastJobRunDetails: wu });


          // TODO - First take  care of the case when threshold exceeded - More info needed
          // TODO - If the job is in state other than completed and its past the run window - Handle here

          // Change the state to lowercase
          const lowerCaseNotificationCondition = notificationCondition.map((condition) => {
            return condition.toLowerCase();
          });

          // The state matches the condition (Failed, Aborted))
          if(lowerCaseNotificationCondition.includes(State.toLowerCase())){
            console.log('-- Notification condition has been met --');
          }

        }
      });

      //TODO - If job was not started with in the given window - Handle Here
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