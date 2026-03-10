import { Queue } from 'bullmq';
import { redisConnectionOptions } from '@/config/redis.js';
import logger from '@/config/logger.js';
import type { ScheduledJob, ArchiveJobData } from '@/types/index.js';

export const archiveQueue = new Queue<ArchiveJobData>('archive', {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
    attempts: 3,
    backoff: { type: 'exponential', delay: 30000 },
  },
});

const scheduledJobs: ScheduledJob<ArchiveJobData>[] = [
  {
    name: 'archive:cost-monitoring',
    jobId: 'archive-cost-monitoring-recurring',
    data: {
      type: 'cost-monitoring',
      daysToKeep: 30,
      retentionDays: 365,
    },
    schedule: '0 5 0 * * *', // Daily just after midnight (production)
    description: 'Archive cost monitoring data daily just after midnight',
  },
];

/**
 * Register all scheduled jobs via idempotent upsert.
 * Safe to call on every startup — will not stack duplicate schedulers.
 */
export async function registerArchiveJobs() {
  logger.info('Registering archive jobs...');

  try {
    for (const job of scheduledJobs) {
      await archiveQueue.upsertJobScheduler(
        job.jobId,
        { pattern: job.schedule },
        { name: job.name, data: job.data }
      );

      logger.info(
        `Scheduled: ${job.name} (${job.schedule})${job.description ? ` - ${job.description}` : ''}`
      );
    }

    logger.info(`Registered ${scheduledJobs.length} archive job(s)`);
  } catch (error) {
    logger.error('Failed to register archive jobs', {
      error: String(error),
    });
    throw error;
  }
}

/**
 * Remove all scheduled jobs. Useful for cleanup or one-time migration.
 */
export async function removeArchiveJobs() {
  logger.info('Removing archive jobs...');

  try {
    for (const job of scheduledJobs) {
      await archiveQueue.removeJobScheduler(job.jobId);
    }

    logger.info('Removed all archive jobs');
  } catch (error) {
    logger.error('Failed to remove archive jobs', {
      error: String(error),
    });
    throw error;
  }
}
