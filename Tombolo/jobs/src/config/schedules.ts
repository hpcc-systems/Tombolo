/**
 * Cron schedule definitions for recurring jobs
 */

import { wuHistoryJobType, hpccToolsJobType } from './constants.js';

export interface ScheduledJob {
  name: string;
  jobId: string;
  data: Record<string, unknown>;
  schedule: string;
  description?: string;
  queue?: 'workunit-history' | 'hpcc-tools';
}

export const scheduledJobs: ScheduledJob[] = [
  {
    name: 'wuQuery',
    jobId: 'wuQuery-recurring',
    data: { type: wuHistoryJobType.QUERY },
    schedule: '0 */45 * * * *', // Every 45 minutes
    description: 'Query HPCC clusters for workunit history',
  },
  {
    name: 'wuDetails',
    jobId: 'wuDetails-recurring',
    data: { type: wuHistoryJobType.DETAILS },
    schedule: '0 */15 * * * *', // Every 4 minutes
    description: 'Fetch workunit performance details',
  },
  {
    name: 'wuInfo',
    jobId: 'wuInfo-recurring',
    data: { type: wuHistoryJobType.INFO },
    schedule: '0 */15 * * * *', // Every 10 minutes
    description: 'Fetch workunit info',
  },
  {
    name: 'hpccToolsSync',
    jobId: 'hpccToolsSync-recurring',
    data: { type: hpccToolsJobType.SYNC },
    schedule: '0 0 * * * *', // Every hour
    description: 'Sync hpcc-tools repository',
    queue: 'hpcc-tools',
  },
];
