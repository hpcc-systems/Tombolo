/**
 * Cron schedule definitions for recurring jobs
 */

export const jobSchedules = {
  // Email job schedules
  email: {
    sendWelcomeEmails: '0 */2 * * * *', // Every 2 minutes
    sendWeeklyDigest: '0 0 9 * * 1', // Every Monday at 9am
  },

  dbJobs: {
    testDbJob: '0 */5 * * * *', // Every 5 minutes
  },

  // Add more job categories as needed
} as const;
