/**
 * Cron schedule definitions for recurring jobs
 */

export const jobSchedules = {
  // Email job schedules
  email: {
    sendWelcomeEmails: '*/5 * * * * *', // Every 5 minutes
    sendWeeklyDigest: '0 0 9 * * 1', // Every Monday at 9am
  },

  // Add more job categories as needed
} as const;
