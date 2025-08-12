const path = require('path');

//Local imports
const logger = require('../config/logger');
const {
  clusterReachabilityMonitoringInterval,
  cluster_monitoring_interval,
  clusterContainerizationCheckInterval,
} = require('../config/monitorings.js');

// Constants
const CLUSTER_MONITORING_FILE_NAME = 'clusterMonitoring.js';
const CLUSTER_TIMEZONE_OFFSET = 'clustertimezoneoffset.js';
const CLUSTER_USAGE_HISTORY_TRACKER = 'submitClusterUsageTracker.js';
const MONITOR_CLUSTER_REACHABILITY_FILE_NAME = 'monitorClusterReachability.js';
const CHECK_CLUSTER_CONTAINERIZATION_FILE_NAME =
  'checkIfClusterIsContainerized.js';

// Cluster status monitoring bree job
async function startClusterMonitoring() {
  try {
    let jobName = 'cluster-monitoring' + new Date().getTime();
    this.bree.add({
      name: jobName,
      // interval: '10s', // For development
      interval: `${cluster_monitoring_interval}m`,
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'cluster',
        CLUSTER_MONITORING_FILE_NAME
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info('Cluster  monitoring job initialized ...');
  } catch (err) {
    logger.error(err.message);
  }
}

async function scheduleClusterTimezoneOffset() {
  logger.info('Cluster timezone offset checker job initialized ...');
  try {
    let jobName = 'cluster-timezone-offset-' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: 'at 02:30am also at 02:30pm',
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'cluster',
        CLUSTER_TIMEZONE_OFFSET
      ),
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
  const uniqueJobName = 'Cluster Usage History Tracker';
  const job = {
    interval: 14400000, // 4 hours
    // interval: "10s", // For development
    name: uniqueJobName,
    path: path.join(
      __dirname,
      '..',
      'jobs',
      'cluster',
      CLUSTER_USAGE_HISTORY_TRACKER
    ),
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
  logger.info('Cluster usage monitoring job initialized ...');
}

async function checkClusterReachability() {
  try {
    let jobName = 'cluster-reachability-monitoring' + new Date().getTime();
    this.bree.add({
      name: jobName,
      // interval: "10s", // For development
      interval: clusterReachabilityMonitoringInterval,
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'cluster',
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
    logger.info('Cluster reachability checker job initialized ...');
  } catch (err) {
    logger.error(err);
  }
}

async function checkClusterContainerization() {
  try {
    let jobName = 'cluster-containerization-check-' + new Date().getTime();
    this.bree.add({
      name: jobName,
      // interval: '10s', // For development
      cron: clusterContainerizationCheckInterval,
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'cluster',
        CHECK_CLUSTER_CONTAINERIZATION_FILE_NAME
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
          isCronJob: true,
        },
      },
    });
    this.bree.start(jobName);
    logger.info('Cluster containerization check job initialized ...');
  } catch (err) {
    logger.error(err);
  }
}

module.exports = {
  scheduleClusterTimezoneOffset,
  createClusterUsageHistoryJob,
  checkClusterReachability,
  checkClusterContainerization,
  startClusterMonitoring,
};
