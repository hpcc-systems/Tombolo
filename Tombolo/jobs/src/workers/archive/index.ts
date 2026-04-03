import { Worker, Job } from 'bullmq';
import { redisConnectionOptions } from '@/config/redis.js';
import logger from '@/config/logger.js';
import { formatErrorForLogging } from '@/utils/errorFormatter.js';
import type { ArchiveJobData, ArchiveJobType } from '@/types/index.js';
import { runCostMonitoringArchive } from './costMonitoring.js';

const archiveHandlers: Record<
  ArchiveJobType,
  (job: ArchiveJobData) => Promise<any>
> = {
  'cost-monitoring': runCostMonitoringArchive,
};

async function processArchiveJob(job: Job<ArchiveJobData>) {
  const { type } = job.data;

  logger.info('Processing archive job', { jobId: job.id, type });

  const handler = archiveHandlers[type];
  if (!handler) {
    throw new Error(`Unknown archive job type: ${type}`);
  }

  const result = await handler(job.data);
  logger.info('Archive job completed', { jobId: job.id, type });
  return result;
}

export const archiveWorker = new Worker('archive', processArchiveJob, {
  autorun: false,
  connection: redisConnectionOptions,
  concurrency: 1,
  limiter: {
    max: 1,
    duration: 1000,
  },
  lockDuration: 300000,
  lockRenewTime: 150000,
});

archiveWorker.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed`, { result });
});

archiveWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed`, formatErrorForLogging(err));
});

archiveWorker.on('error', err => {
  logger.error('Worker error', formatErrorForLogging(err));
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing archive worker...');
  await archiveWorker.close();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing archive worker...');
  await archiveWorker.close();
});
