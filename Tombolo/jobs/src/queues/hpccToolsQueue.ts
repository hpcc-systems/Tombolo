import { Queue } from 'bullmq';
import { redisConnectionOptions } from '@/config/redis.js';
import { HpccToolsJobType, type ScheduledJob } from '@/types/index.js';
import logger from '@/config/logger.js';

export const hpccToolsQueue = new Queue('hpcc-tools', {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 10,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 * 60 * 5 }, // 5 minutes
  },
});

const scheduledJobs: ScheduledJob[] = [
  {
    name: 'hpccToolsSync',
    jobId: 'hpccToolsSync-recurring',
    data: { type: HpccToolsJobType.SYNC },
    schedule: '0 0 0 * * *', // Every 24 hours
    description: 'Sync hpcc-tools repository',
  },
];

/**
 * Register all hpcc-tools scheduled jobs via idempotent upsert.
 * Safe to call on every startup — will not stack duplicate schedulers.
 */
export async function registerHpccToolsJobs() {
  logger.info('Registering hpcc-tools jobs...');

  try {
    for (const job of scheduledJobs) {
      await hpccToolsQueue.upsertJobScheduler(
        job.jobId,
        { pattern: job.schedule },
        { name: job.name, data: job.data }
      );

      logger.info(
        `Scheduled: ${job.name} (${job.schedule})${job.description ? ` - ${job.description}` : ''}`
      );
    }

    logger.info(`Registered ${scheduledJobs.length} hpcc-tools job(s)`);
  } catch (error) {
    logger.error('Failed to register hpcc-tools jobs', {
      error: String(error),
    });
    throw error;
  }
}

/**
 * Remove all hpcc-tools scheduled jobs.
 */
export async function removeHpccToolsJobs() {
  logger.info('Removing hpcc-tools scheduled jobs...');

  try {
    for (const job of scheduledJobs) {
      await hpccToolsQueue.removeJobScheduler(job.jobId);
    }

    logger.info('Removed all hpcc-tools scheduled jobs');
  } catch (error) {
    logger.error('Failed to remove hpcc-tools jobs', { error: String(error) });
    throw error;
  }
}
