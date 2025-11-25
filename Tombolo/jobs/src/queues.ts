import { Queue } from 'bullmq';
import { redisConnectionOptions } from './config/config.js';

export const workunitHistoryQueue = new Queue('workunit-history', {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 5,
    backoff: { type: 'exponential', delay: 10000 },
  },
});
