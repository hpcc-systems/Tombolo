import express from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { registerScheduledJobs } from './scheduler.js';
import { workunitHistoryQueue } from './queues/workunitHistoryQueue.js';
import { workunitHistoryWorker } from './workers/workunitHistory/workunitHistoryWorker.js';
import logger from './config/logger.js';

const PORT = process.env.BULL_BOARD_PORT || 3003;

async function startJobProcessor() {
  logger.info('Starting BullMQ job processor...');

  // Start the worker (it will process jobs as they come in)
  logger.info(
    `Workunit history worker started (concurrency: 1) - Worker ready: ${workunitHistoryWorker.isRunning()}`
  );

  // Register scheduled jobs
  await registerScheduledJobs();

  // Setup Bull Board
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(workunitHistoryQueue)],
    serverAdapter: serverAdapter,
  });

  // Create Express app
  const app = express();

  app.use('/admin/queues', serverAdapter.getRouter());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
    logger.error(`Failed to start job processor: ${String(err)}`);
    process.exit(1);
  });
