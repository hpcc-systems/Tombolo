import path from 'path';
import { monitor_cost_interval } from '../config/monitorings.js';

import logger from '../config/logger.js';
const MONITOR_COST_FILE_NAME = 'monitorCost.js';
const ANALYZE_COST_FILE_NAME = 'analyzeCost.js';

function createMonitorCostJob() {
  try {
    let jobName = 'monitor-cost-' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: monitor_cost_interval,
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'costMonitoring',
        MONITOR_COST_FILE_NAME
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

function createAnalyzeCostJob() {
  const analyzeCostJobName = `analyze-cost-${new Date().getTime()}`;
  try {
    this.bree.add({
      name: analyzeCostJobName,
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'costMonitoring',
        ANALYZE_COST_FILE_NAME
      ),
      timeout: 0, // Run immediately
      worker: {
        workerData: {
          jobName: analyzeCostJobName,
        },
      },
    });
    this.bree.start(analyzeCostJobName);
  } catch (err) {
    logger.error('Failed to add analyze-cost job', err);
  }
}

export { createMonitorCostJob, createAnalyzeCostJob };
