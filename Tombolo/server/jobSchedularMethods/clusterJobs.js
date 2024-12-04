const path = require("path");

//Local imports
const logger = require("../config/logger");
const models = require("../models");
const {
  clusterReachabilityMonitoringInterval,
} = require("../config/monitorings.js");

// Constants
const ClusterMonitoring = models.clusterMonitoring;
const CLUSTER_TIMEZONE_OFFSET = "clustertimezoneoffset.js";
const CLUSTER_USAGE_HISTORY_TRACKER = "submitClusterUsageTracker.js";
const SUBMIT_CLUSTER_MONITORING_JOB = "submitClusterMonitoring.js";
const MONITOR_CLUSTER_REACHABILITY_FILE_NAME = "monitorClusterReachability.js";


async function scheduleClusterTimezoneOffset() {
  logger.info("Cluster timezone offset checker job initialized ...");
  try {
    let jobName = "cluster-timezone-offset-" + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: "at 02:30am also at 02:30pm",
      path: path.join(__dirname, "..", "jobs", "cluster", CLUSTER_TIMEZONE_OFFSET),
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
    path: path.join(__dirname, "..", "jobs", "cluster", CLUSTER_USAGE_HISTORY_TRACKER),
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
  logger.info("Cluster usage monitoring job initialized ...");
}

function createClusterMonitoringBreeJob({ clusterMonitoring_id, cron }) {
  const uniqueJobName = `Cluster Monitoring - ${clusterMonitoring_id}`;
  const job = {
    cron,
    name: uniqueJobName,
    path: path.join(__dirname, "..", "jobs", "cluster", SUBMIT_CLUSTER_MONITORING_JOB),
    worker: {
      workerData: { clusterMonitoring_id },
    },
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
}

async function scheduleClusterMonitoringOnServerStart() {
  try {
    logger.info("Cluster monitoring initialized ...");
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

async function checkClusterReachability() {
  try {
    let jobName = "cluster-reachability-monitoring" + new Date().getTime();
    this.bree.add({
      name: jobName,
      // interval: "10s", // For development
      interval: clusterReachabilityMonitoringInterval,
      path: path.join(
        __dirname,
        "..",
        "jobs",
        "cluster",
        MONITOR_CLUSTER_REACHABILITY_FILE_NAME
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info("Cluster reachability checker job initialized ...");
  } catch (err) {
    logger.error(err);
  }
}

module.exports = {
  scheduleClusterTimezoneOffset,
  createClusterUsageHistoryJob,
  createClusterMonitoringBreeJob,
  scheduleClusterMonitoringOnServerStart,
  checkClusterReachability,
};
