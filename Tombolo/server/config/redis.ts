import type { RedisOptions } from 'ioredis';

export const redisConnectionOptions: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  username: process.env.REDIS_USER,
  password: process.env.REDIS_PASSWORD,
  db: Number(process.env.REDIS_DB) || 0,
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  enableReadyCheck: true,
};
