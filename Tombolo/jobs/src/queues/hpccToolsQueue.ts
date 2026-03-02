import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../config/config.js';

export const hpccToolsQueue = new Queue('hpcc-tools', {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 10,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 * 60 * 5 }, // 5 minutes
  },
});
