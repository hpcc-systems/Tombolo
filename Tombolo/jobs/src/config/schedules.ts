/**
 * Cron schedule definitions for recurring jobs
 */

export const jobSchedules = {
  wuHistory: {
    wuDetails: '0 */15 * * * *', // Every 15 minutes
    wuQuery: '0 */45 * * * *', // Every 45 minutes
  },

  wuHistory: {
    wuDetails: '0 */15 * * * *', // Every 15 minutes
    wuQuery: '0 */45 * * * *', // Every 45 minutes
  },

  // Add more job categories as needed
} as const;
