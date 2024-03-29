const { parentPort, workerData } = require("worker_threads");
const { WorkunitsService } = require("@hpcc-js/comms");

const logger = require("../../config/logger");
const models = require("../../models");
const { decryptString } = require("../../utils/cipher");
const { matchJobName, findStartAndEndTimes } = require("./monitorJobsUtil");

const JobMonitoring = models.jobMonitoring;
const cluster = models.cluster;
const Monitoring_notifications = models.monitoring_notifications;

const os = require("os");
const { all } = require("axios");

(async () => {
  try {
   const now = new Date(); // UTC time

   // Errors will be caught by the main catch block
   const jobMonitorings = await JobMonitoring.findAll({
      where: { isActive: 1, approvalStatus: "Approved" },
      raw: true,
    });


    // Group monitoring by cluster ID so it will be easier to make call to HPCC cluster
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
        logger.error(`Failed to decrypt hash for cluster ${clusterInfo.id}: ${error.message}`);
      }
    });

    // Get all work units from each cluster
  


   
  } catch (err) {
    logger.error(err);
  } finally {
    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
  }
})();
