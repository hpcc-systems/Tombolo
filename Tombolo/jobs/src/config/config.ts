import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import type { RedisOptions } from 'ioredis';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from Tombolo/.env (where docker-compose is) or local .env
const tomboloENV = path.join(__dirname, '..', '..', '..', '.env'); // Tombolo/.env
const jobsENV = path.join(process.cwd(), '.env'); // Tombolo/jobs/.env
const ENVPath = fs.existsSync(tomboloENV) ? tomboloENV : jobsENV;

console.log('Loading .env from:', ENVPath); // Debug log
dotenv.config({ path: ENVPath });

export const redisConnectionOptions: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  username: process.env.REDIS_USER,
  password: process.env.REDIS_PASSWORD,
  db: Number(process.env.REDIS_DB) || 0,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    // Retry after 1s, 2s, 4s, 8s, etc., with a max of 10s
    const delay = Math.min(times * 1000, 10000);
    console.log(`Redis connection retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  connectTimeout: 10000, // 10 seconds
  enableReadyCheck: true,
  // Enable if you use Redis TLS in prod
  //   tls: process.env.NODE_ENV === 'production' ? {} : undefined,
};
