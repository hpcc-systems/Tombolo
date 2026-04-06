import express from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Redis } from 'ioredis';
import type { Queue } from 'bullmq';
import {
  workunitHistoryQueue,
  registerScheduledJobs,
} from './queues/workunitHistory.js';
import { workunitHistoryWorker } from './workers/workunitHistory/index.js';
import { archiveQueue, registerArchiveJobs } from './queues/archive/index.js';
import { archiveWorker } from './workers/archive/index.js';
import {
  hpccToolsQueue,
  registerHpccToolsJobs,
} from './queues/hpccToolsQueue.js';
import { hpccToolsWorker } from './workers/hpccTools/hpccToolsWorker.js';
import { redisConnectionOptions } from './config/redis.js';
import logger from './config/logger.js';
import { formatErrorForLogging } from './utils/errorFormatter.js';
import { hpccToolsRoutes } from './routes/hpccToolsRoutes.js';

// Create Redis client for health checks
const redisClient = new Redis(redisConnectionOptions);

// Add Redis error handlers
redisClient.on('error', err => {
  logger.error('Redis client error', formatErrorForLogging(err));
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis client reconnecting...');
});

const PORT = process.env.BULL_BOARD_PORT || 8678;

async function clearQueueOnStartup(queue: Queue, queueName: string) {
  logger.warn(`Clearing BullMQ queue on startup: ${queueName}`);
  await queue.obliterate({ force: true });
  logger.info(`Cleared BullMQ queue on startup: ${queueName}`);
}

async function clearBullMqStateOnStartup() {
  if (process.env.NODE_ENV !== 'development') {
    logger.info(
      'NODE_ENV is not development, skipping BullMQ startup queue clear',
      {
        nodeEnv: process.env.NODE_ENV,
      }
    );
    return;
  }

  await clearQueueOnStartup(workunitHistoryQueue, 'workunit-history');
  await clearQueueOnStartup(archiveQueue, 'archive');
  await clearQueueOnStartup(hpccToolsQueue, 'hpcc-tools');
}

function runWorkerWithLogging(workerName: string, runner: () => Promise<void>) {
  runner().catch(err => {
    logger.error(
      `${workerName} worker stopped unexpectedly`,
      formatErrorForLogging(err)
    );
  });
}

async function startJobProcessor() {
  logger.info('Starting BullMQ job processor...');

  await clearBullMqStateOnStartup();

  await registerScheduledJobs();
  await registerArchiveJobs();
  await registerHpccToolsJobs();

  // Start workers after startup cleanup and schedule registration.
  runWorkerWithLogging('Workunit history', () => workunitHistoryWorker.run());
  runWorkerWithLogging('Archive', () => archiveWorker.run());
  runWorkerWithLogging('hpcc-tools', () => hpccToolsWorker.run());

  logger.info(
    `Workunit history worker started (concurrency: 1) - Worker ready: ${workunitHistoryWorker.isRunning()}`
  );
  logger.info(
    `Archive worker started (concurrency: 1) - Worker ready: ${archiveWorker.isRunning()}`
  );
  logger.info(
    `hpcc-tools worker started (concurrency: 1) - Worker ready: ${hpccToolsWorker.isRunning()}`
  );

  // Setup Bull Board
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullMQAdapter(workunitHistoryQueue),
      new BullMQAdapter(archiveQueue),
      new BullMQAdapter(hpccToolsQueue),
    ],
    serverAdapter: serverAdapter,
  });

  // Create Express app
  const app = express();
  app.use(express.json());

  // API Key authentication middleware for Bull Board
  const apiKeyAuth = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const validApiKey =
      process.env.JOBS_API_KEY || process.env.BULL_BOARD_API_KEY;

    // Skip auth if no API key is configured
    if (!validApiKey) {
      return next();
    }

    if (apiKey === validApiKey) {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized - Invalid API key' });
    }
  };

  app.use('/admin/queues', apiKeyAuth, serverAdapter.getRouter());
  app.use('/queue/hpcc-tools', apiKeyAuth, hpccToolsRoutes);

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      // Check Redis connection
      await redisClient.ping();

      res.json({
        status: 'ok',
        redis: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Health check failed - Redis connection error:', error);
      res.status(503).json({
        status: 'error',
        redis: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Start Bull Board server
  app.listen(PORT, () => {
    logger.info(
      `Bull Board UI available at http://localhost:${PORT}/admin/queues`
    );
    logger.info(`Health check at http://localhost:${PORT}/health`);
  });

  logger.info('Job processor started successfully!');
}

startJobProcessor()
  .then(() => logger.info('BullMQ job processor is running'))
  .catch(err => {
    logger.error('Failed to start job processor', formatErrorForLogging(err));
    process.exit(1);
  });
