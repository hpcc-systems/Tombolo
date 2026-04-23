import { Queue } from 'bullmq';
import type { NotificationJobPayload } from '@tombolo/shared';
import { redisConnectionOptions } from '../config/redis.js';

export const notificationsQueue = new Queue<NotificationJobPayload>(
  'notifications',
  {
    connection: redisConnectionOptions,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100,
      attempts: 3,
      backoff: { type: 'exponential', delay: 60000 },
    },
  }
);
