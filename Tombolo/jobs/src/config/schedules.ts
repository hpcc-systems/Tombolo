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

  wuHistory: {
    wuDetails: '0 */15 * * * *', // Every 15 minutes
    wuQuery: '0 */45 * * * *', // Every 45 minutes
  },

  // Add more job categories as needed
} as const;
