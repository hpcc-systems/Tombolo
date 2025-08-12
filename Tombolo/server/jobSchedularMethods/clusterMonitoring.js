const path = require('path');
const { cluster_monitoring_interval } = require('../config/monitorings');
const logger = require('../config/logger');

// Constants
const CLUSTER_MONITORING_FILE_NAME = 'clusterMonitoring.js';

// Cluster status monitoring bree job
async function startClusterMonitoring() {
  try {
    let jobName = 'cluster-monitoring' + new Date().getTime();
    this.bree.add({
      name: jobName,
      // interval: '30s', // For development
      interval: `${cluster_monitoring_interval}m`,
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'clusterMonitoring',
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

module.exports = {
  startClusterMonitoring,
};
