export enum wuHistoryJobType {
  QUERY = 'query',
  DETAILS = 'details',
  INFO = 'info',
}

export interface ScheduledJob<T = Record<string, unknown>> {
  name: string;
  jobId: string;
  data: T;
  schedule: string;
  description?: string;
}

export interface WorkunitHistoryJobData {
  type: wuHistoryJobType;
  [key: string]: unknown;
}

export type ArchiveJobType = 'cost-monitoring';

export interface ArchiveJobData {
  type: ArchiveJobType;
  daysToKeep?: number;
  retentionDays?: number;
  [key: string]: unknown;
}
