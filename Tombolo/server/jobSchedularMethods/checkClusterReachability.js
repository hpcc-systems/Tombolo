const path = require("path");
const { clusterReachabilityMonitoringInterval } = require("../config/monitorings.js");
const logger = require("../config/logger.js");

// Constants
const MONITOR_CLUSTER_REACHABILITY_FILE_NAME = "monitorClusterReachability.js";


// Job monitoring bree job
async function checkClusterReachability() {
  try {
    let jobName = "cluster-reachability-monitoring" + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: "10s", // For development
      // interval: clusterReachabilityMonitoringInterval,
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
    logger.info("🕗 CHECKING CLUSTER REACHABILITY ... ");
  } catch (err) {
    logger.error(err);
  }
}

module.exports = {
  checkClusterReachability,
};
