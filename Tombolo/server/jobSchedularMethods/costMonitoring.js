const path = require('path');

const logger = require('../config/logger');
const MONITOR_COST_PER_USER_FILE_NAME = 'monitorCostPerUser.js';
const ANALYZE_COST_PER_USER_FILE_NAME = 'analyzeCostPerUser.js';

function createMonitorCostPerUserJob() {
  try {
    let jobName = 'monitor-cost-per-user' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: '1 hours',
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'costMonitoring',
        MONITOR_COST_PER_USER_FILE_NAME
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info('Cost per user monitoring initialized ...');
  } catch (err) {
    logger.error('Failed to add monitor-cost-per-user job', err);
  }
}

function createAnalyzeCostPerUserJob() {
  const analyzeCostPerUserJobName = `analyze-cost-per-user-${new Date().getTime()}`;
  try {
    this.bree.add({
      name: analyzeCostPerUserJobName,
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'costMonitoring',
        ANALYZE_COST_PER_USER_FILE_NAME
      ),
      timeout: 0, // Run immediately
      worker: {
        workerData: {
          jobName: analyzeCostPerUserJobName,
        },
      },
    });
    this.bree.start(analyzeCostPerUserJobName);
  } catch (err) {
    logger.error('Failed to add analyze-cost-per-user job', err);
  }
}

module.exports = {
  createMonitorCostPerUserJob,
  createAnalyzeCostPerUserJob,
};
