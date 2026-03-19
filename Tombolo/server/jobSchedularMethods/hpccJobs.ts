import { join } from 'path';

import logger from '../config/logger.js';
import { getDirname } from '../utils/polyfills.js';
import { resolveJobPath } from './jobPathResolver.js';

const __dirname = getDirname(import.meta.url);
const JOB_STATUS_POLLER = 'statusPoller.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scheduleJobStatusPolling(this: any): Promise<void> {
  logger.info('Status puller for dataflow jobs initialized ...');

  try {
    const jobName = 'job-status-poller-' + new Date().getTime();

    const defaultDistPath = join(
      __dirname,
      '..',
      '..',
      'dist',
      'jobs',
      JOB_STATUS_POLLER.replace('.ts', '.js')
    );
    this.bree.add({
      name: jobName,
      interval: '20s',
      path: resolveJobPath(defaultDistPath),
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
