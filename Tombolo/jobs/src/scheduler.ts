/**
 * Job Scheduler
 *
 * Registers recurring jobs with Sidequest using cron schedules.
 * All schedules are defined in config/schedules.ts
 */

import { Sidequest } from 'sidequest';
import { JobClassType } from '@sidequest/core';
import { jobSchedules } from './config/schedules.js';
import logger from './config/logger.js';

// Import all job classes
import { WorkunitQueryJob } from './jobs/workunitQueryJob.js';
import { WorkunitDetailJob } from './jobs/workunitDetailJob.js';

/**
 * Job schedule configuration
 * Maps schedule names to job classes and their arguments
 */
interface ScheduleConfig {
  jobClass: JobClassType;
  args?: any;
  queue?: string;
  schedule: string;
  description?: string;
}

/**
 * Define all scheduled jobs here
 * This is the central place to configure recurring jobs
 */
const scheduledJobs: Record<string, ScheduleConfig> = {
  wuQuery: {
    jobClass: WorkunitQueryJob,
    schedule: jobSchedules.wuHistory.wuQuery,
  },

  wuDetails: {
    jobClass: WorkunitDetailJob,
    schedule: jobSchedules.wuHistory.wuDetails,
  },

  // Example: Clean audit records weekly
  // 'cleanAuditRecords': {
  //   jobClass: DataCleanupJob,
  //   args: {
  //     tableName: 'audit_logs',
  //     olderThanDays: 365,
  //   },
  //   queue: 'cleanup',
  //   schedule: jobSchedules.cleanup.cleanAuditRecords,
  //   description: 'Clean audit records older than 1 year',
  // },
};

/**
 * Register all scheduled jobs with Sidequest
 * Call this after Sidequest.start()
 */
export function registerScheduledJobs(): void {
  logger.info('Registering scheduled jobs...');

  let registeredCount = 0;

  for (const [name, config] of Object.entries(scheduledJobs)) {
    try {
      const builder = Sidequest.build(config.jobClass);

      // Set queue if specified
      if (config.queue) {
        builder.queue(config.queue);
      }

      // Register the schedule
      builder.schedule(config.schedule, config.args);

      logger.info(
        `Scheduled: ${name} - ${config.description || 'No description'} (${config.schedule})`
      );
      registeredCount++;
    } catch (error) {
      logger.error(`Failed to schedule ${name}:`, error);
    }
  }

  logger.info(`Registered ${registeredCount} scheduled job(s)`);
}

/**
 * Get list of all scheduled jobs (for debugging/monitoring)
 */
export function getScheduledJobsList() {
  return Object.entries(scheduledJobs).map(([name, config]) => ({
    name,
    jobClass: config.jobClass.name,
    queue: config.queue || 'default',
    schedule: config.schedule,
    description: config.description,
  }));
}
