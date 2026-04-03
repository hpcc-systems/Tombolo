import { join } from 'path';
import { monitor_cost_interval } from '../config/monitorings.js';
import logger from '../config/logger.js';
import { getDirname } from '../utils/polyfills.js';
import { resolveJobPath } from './jobPathResolver.js';

const __dirname = getDirname(import.meta.url);
const MONITOR_COST_FILE_NAME = 'monitorCost.js';
const ANALYZE_COST_FILE_NAME = 'analyzeCost.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createMonitorCostJob(this: any): Promise<void> {
  try {
    const jobName = 'monitor-cost-' + new Date().getTime();
    await this.bree.add({
      name: jobName,
      interval: monitor_cost_interval,
      path: resolveJobPath(
        join(__dirname, '..', 'jobs', 'costMonitoring', MONITOR_COST_FILE_NAME)
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    await this.bree.start(jobName);
    logger.info('Cost per user monitoring initialized ...');
  } catch (err) {
    logger.error('Failed to add monitor-cost-per-user job', err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createAnalyzeCostJob(this: any): Promise<void> {
  const analyzeCostJobName = `analyze-cost-${new Date().getTime()}`;
  try {
    await this.bree.add({
      name: analyzeCostJobName,
      path: resolveJobPath(
        join(__dirname, '..', 'jobs', 'costMonitoring', ANALYZE_COST_FILE_NAME)
      ),
      timeout: 0, // Run immediately
      worker: {
        workerData: {
          jobName: analyzeCostJobName,
        },
      },
    });
    await this.bree.start(analyzeCostJobName);
  } catch (err) {
    logger.error('Failed to add analyze-cost job', err);
  }
}

export { createMonitorCostJob, createAnalyzeCostJob };
