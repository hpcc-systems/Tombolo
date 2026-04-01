import { Worker } from 'bullmq';
import { redisConnectionOptions } from '@/config/redis.js';
import logger from '@/config/logger.js';
import { formatErrorForLogging } from '@/utils/errorFormatter.js';
import processHpccToolsJob from './processor.js';

/**
 * BullMQ worker for the hpcc-tools repository sync job
 */
export const hpccToolsWorker = new Worker('hpcc-tools', processHpccToolsJob, {
  connection: redisConnectionOptions,
  concurrency: 1, // Ensure only one git sync at a time
  limiter: {
    max: 1,
    duration: 1_000,
  },
  lockDuration: 600_000, // 10 minutes
  lockRenewTime: 150_000,
});

// Worker event handlers
hpccToolsWorker.on('completed', (job, result) => {
  logger.info(`hpcc-tools job ${job.id} completed successfully`, { result });
});

hpccToolsWorker.on('failed', (job, err) => {
  logger.error(`hpcc-tools job ${job?.id} failed`, formatErrorForLogging(err));
});

hpccToolsWorker.on('error', err => {
  logger.error('hpcc-tools worker error', formatErrorForLogging(err));
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down hpcc-tools worker...');
  await hpccToolsWorker.close();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
