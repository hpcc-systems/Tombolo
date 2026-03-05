export enum wuHistoryJobType {
  QUERY = 'query',
  DETAILS = 'details',
  INFO = 'info',
}

export interface ScheduledJob {
  name: string;
  jobId: string;
  data: Record<string, unknown>;
  schedule: string;
  description?: string;
}

export interface WorkunitHistoryJobData {
  type: wuHistoryJobType;
  [key: string]: unknown;
}
