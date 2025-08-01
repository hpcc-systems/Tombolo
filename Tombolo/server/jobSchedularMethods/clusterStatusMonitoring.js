const path = require('path');
const { cluster_status_monitoring_interval } = require('../config/monitorings');
const logger = require('../config/logger');

// Constants
const CLUSTER_STATUS_MONITORING_FILE_NAME = 'clusterMonitoring.js';

// Cluster status monitoring bree job
async function startClusterStatusMonitoring() {
  try {
    let jobName = 'cluster-status-monitoring' + new Date().getTime();
    this.bree.add({
      name: jobName,
      // interval: '30s', // For development
      interval: `${cluster_status_monitoring_interval}m`,
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'cluster',
        CLUSTER_STATUS_MONITORING_FILE_NAME
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info('Cluster status monitoring job initialized ...');
  } catch (err) {
    logger.error(err.message);
  }
}

module.exports = {
  startClusterStatusMonitoring,
};
