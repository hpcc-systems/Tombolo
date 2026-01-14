import { workunitHistoryQueue } from './queues/index.js';
import { scheduledJobs } from './config/schedules.js';
import logger from './config/logger.js';

/**
 * Register all scheduled jobs
 */
export async function registerScheduledJobs() {
  logger.info('Registering scheduled jobs...');

  try {
    for (const job of scheduledJobs) {
      await workunitHistoryQueue.add(job.name, job.data, {
        repeat: {
          pattern: job.schedule,
        },
        jobId: job.jobId,
      });

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
 * Remove all scheduled jobs (useful for cleanup)
 */
export async function removeScheduledJobs() {
  logger.info('Removing scheduled jobs...');

  try {
    for (const job of scheduledJobs) {
      await workunitHistoryQueue.removeJobScheduler(job.jobId);
    }

    logger.info('Removed all scheduled jobs');
  } catch (error) {
    logger.error('Failed to remove scheduled jobs', {
      error: String(error),
    });
    throw error;
  }
}
