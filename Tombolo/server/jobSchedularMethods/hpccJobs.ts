import path from 'path';

import logger from '../config/logger.js';
import { getDirname } from '../utils/polyfills.js';

const __dirname = getDirname(import.meta.url);
const JOB_STATUS_POLLER = 'statusPoller.js';

async function scheduleJobStatusPolling(this: any): Promise<void> {
  logger.info('Status puller for dataflow jobs initialized ...');

  try {
    let jobName = 'job-status-poller-' + new Date().getTime();

    this.bree.add({
      name: jobName,
      interval: '20s',
      path: path.join(__dirname, '..', 'jobs', JOB_STATUS_POLLER),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    this.bree.start(jobName);
  } catch (err) {
    logger.error('hpccJobs - scheduleJobStatusPolling: ', err);
  }
}

export { scheduleJobStatusPolling };
