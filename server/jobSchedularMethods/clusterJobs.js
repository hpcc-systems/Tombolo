const path = require("path");

const logger = require("../config/logger");
const models = require("../models");

const ClusterMonitoring = models.clusterMonitoring;
const CLUSTER_TIMEZONE_OFFSET = "clustertimezoneoffset.js";
const CLUSTER_USAGE_HISTORY_TRACKER = "submitClusterUsageTracker.js";
const SUBMIT_CLUSTER_MONITORING_JOB = "submitClusterMonitoring.js";

async function scheduleClusterTimezoneOffset() {
  logger.info("☸ CLUSTER TIMEZONE OFFSET STARTED ...");
  try {
    let jobName = "cluster-timezone-offset-" + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: "at 02:30am also at 02:30pm",
      path: path.join(__dirname, "..", "jobs", CLUSTER_TIMEZONE_OFFSET),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    this.bree.start(jobName);
  } catch (err) {
    logger.error(err);
  }
}

async function createClusterUsageHistoryJob() {
  const uniqueJobName = `Cluster Usage History Tracker`;
  const job = {
    interval: 14400000, // 4 hours
    name: uniqueJobName,
    path: path.join(__dirname, "..", "jobs", CLUSTER_USAGE_HISTORY_TRACKER),
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
  logger.info("📈 CLUSTER USAGE HISTORY TRACKER JOB STARTED ...");
}

function createClusterMonitoringBreeJob({ clusterMonitoring_id, cron }) {
  const uniqueJobName = `Cluster Monitoring - ${clusterMonitoring_id}`;
  const job = {
    cron,
    name: uniqueJobName,
    path: path.join(__dirname, "..", "jobs", SUBMIT_CLUSTER_MONITORING_JOB),
    worker: {
      workerData: { clusterMonitoring_id },
    },
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
}

async function scheduleClusterMonitoringOnServerStart() {
  try {
    logger.info("📺 CLUSTER MONITORING STARTED ...");
    const clusterMonitoring = await ClusterMonitoring.findAll({ raw: true });
    for (let monitoring of clusterMonitoring) {
      const { id, cron, isActive } = monitoring;
      if (isActive) {
        this.createClusterMonitoringBreeJob({
          clusterMonitoring_id: id,
          cron,
        });
      }
    }
  } catch (err) {
    logger.error(err);
  }
}

module.exports = {
  scheduleClusterTimezoneOffset,
  createClusterUsageHistoryJob,
  createClusterMonitoringBreeJob,
  scheduleClusterMonitoringOnServerStart,
};
