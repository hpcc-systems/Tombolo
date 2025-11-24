import { Queue } from 'bullmq';
import { redisConnection } from '../config/config.js';

export const workunitHistoryQueue = new Queue('workunit-history', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 5,
    backoff: { type: 'exponential', delay: 10000 },
  },
});
