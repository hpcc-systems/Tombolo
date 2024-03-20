const { parentPort, workerData } = require("worker_threads");
const { WorkunitsService } = require("@hpcc-js/comms");


const logger = require("../../config/logger");
const models = require("../../models");
const {decryptString} = require("../../utils/cipher");

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

    // Decrypting passwords
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

    // TODO - remove  later - write the wuDetailInfo to test file located in root
    const fs = require("fs");
    fs.writeFileSync("test.json", JSON.stringify(wuDetailInfo, null, 2));
    // ----------------------------------------

    // -- Check if workunit name ( Job name ) matches any of the job monitoring name or pattern
    jobMonitorings.forEach((monitoring) => {
      console.log('Here --')
      const {
        clusterId,
        jobName: jobNameOrPattern,
        monitoringScope,
        id,
      } = monitoring;

      const clusterWUs = wuDetailInfo[clusterId];

      if (!clusterWUs) {
        return;
      }
      // ------------------------------ Job monitorings to be updated ------------------------------
      const jobMonitoringsToUpdate = {};
      //--------------------------------------------------------------------------------------------

      clusterWUs.forEach((wu) => {
        const { Wuid, Jobname, State } = wu;
        console.log('----------dd--------------------------------');
        console.log(Wuid, Jobname, State);
        console.log('------------------------------------------');

        // Check if the job name matches the name or pattern
        if (monitoringScope === "SpecificJob" && Jobname === jobNameOrPattern) {
          jobMonitoringsToUpdate[Wuid] = {id, details: wu};


          // Check if any notification conditions are met
          let {
            metaData: {
              notificationMetaData: { notificationCondition },
            },
          } = monitoring;

          // The state matches the condition
          notificationCondition = notificationCondition.map((condition) => {
            return condition.toLowerCase();
          });

          console.log('----------------NC ----------------------------');
          console.log(notificationCondition);
          console.log(State.toLowerCase());
          console.log("----------------------------------------------");


          if(notificationCondition.includes(State.toLowerCase())){
            console.log(" --- this notification condition is met ---", State)
          }
        }
      });
    });
  } catch (err) {
    logger.error(err);
  } finally {
    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
  }
})();