/**
 * Workunit History Worker
 * Processes jobs from the workunit-history queue with concurrency of 1
 * Runs in main thread with error handling and timer queue mitigation
 */

import { Worker } from 'bullmq';
import { redisConnection } from '../../config/config.js';
import logger from '../../config/logger.js';

// Import the processor function directly (runs in main thread)
import processWorkunitHistoryJob from './processor.js';

// Create worker with concurrency of 1 (only one job at a time)
// NOTE: Not using worker threads because Node.js doesn't allow --max-old-space-size
// or --expose-gc flags in worker threads. The processor handles errors gracefully
// and uses setImmediate to avoid timer queue overflow.
export const workunitHistoryWorker = new Worker(
  'workunit-history',
  processWorkunitHistoryJob, // Function instead of file path - runs in main thread
  {
    connection: redisConnection,
    concurrency: 1, // IMPORTANT: Only process one job at a time
    limiter: {
      max: 1, // Maximum 1 job
      duration: 1000, // per second
    },
    lockDuration: 300000, // Lock for 5 minutes (reduce lock extension timer frequency)
    lockRenewTime: 150000, // Renew lock every 2.5 minutes (half of lock duration)
  }
);

// Worker event handlers
workunitHistoryWorker.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed`, { result });
});

workunitHistoryWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed`, { error: String(err) });
});

workunitHistoryWorker.on('error', err => {
  logger.error('Worker error', { error: String(err) });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing workunit history worker...');
  await workunitHistoryWorker.close();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing workunit history worker...');
  await workunitHistoryWorker.close();
});
