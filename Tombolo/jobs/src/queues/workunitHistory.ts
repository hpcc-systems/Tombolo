import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../config/redis.js';
import { wuHistoryJobType, type ScheduledJob } from '../types/index.js';
import logger from '../config/logger.js';

export const workunitHistoryQueue = new Queue('workunit-history', {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 5,
    backoff: { type: 'exponential', delay: 10000 },
  },
});

const scheduledJobs: ScheduledJob[] = [
  {
    name: 'wuQuery',
    jobId: 'wuQuery-recurring',
    data: { type: wuHistoryJobType.QUERY },
    schedule: '0 7,52 * * * *', // Every ~45 minutes, offset +7 min to avoid collision
    description: 'Query HPCC clusters for workunit history',
  },
  {
    name: 'wuDetails',
    jobId: 'wuDetails-recurring',
    data: { type: wuHistoryJobType.DETAILS },
    schedule: '0 */15 * * * *', // Every 15 minutes, at :00/:15/:30/:45
    description: 'Fetch workunit performance details',
  },
  {
    name: 'wuInfo',
    jobId: 'wuInfo-recurring',
    data: { type: wuHistoryJobType.INFO },
    schedule: '0 3,18,33,48 * * * *', // Every 15 minutes, offset +3 min after wuDetails
    description: 'Fetch workunit info',
  },
  // Add more scheduled jobs here as needed
];

/**
 * Register all scheduled jobs via idempotent upsert.
 * Safe to call on every startup — will not stack duplicate schedulers.
 */
export async function registerScheduledJobs() {
  logger.info('Registering scheduled jobs...');

  try {
    for (const job of scheduledJobs) {
      await workunitHistoryQueue.upsertJobScheduler(
        job.jobId,
        { pattern: job.schedule },
        { name: job.name, data: job.data }
      );

      logger.info(
        `Scheduled: ${job.name} (${job.schedule})${job.description ? ` - ${job.description}` : ''}`
      );
    }

    logger.info(`Registered ${scheduledJobs.length} scheduled job(s)`);
  } catch (error) {
    logger.error('Failed to register scheduled jobs', { error: String(error) });
    throw error;
  }
}

/**
 * Remove all scheduled jobs. Useful for cleanup or one-time migration
 * away from legacy queue.add({ repeat }) schedulers.
 */
export async function removeScheduledJobs() {
  logger.info('Removing scheduled jobs...');

  try {
    for (const job of scheduledJobs) {
      await workunitHistoryQueue.removeJobScheduler(job.jobId);
    }

    logger.info('Removed all scheduled jobs');
  } catch (error) {
    logger.error('Failed to remove scheduled jobs', { error: String(error) });
    throw error;
  }
}
