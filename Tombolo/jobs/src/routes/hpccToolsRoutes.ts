import { Router } from 'express';
import { hpccToolsQueue } from '../queues/hpccToolsQueue.js';
import { HpccToolsJobType } from '../types/index.js';
import logger from '../config/logger.js';

const hpccToolsRoutes = Router();

// Manual trigger endpoint for HPCC tools sync queueing.
hpccToolsRoutes.post('/sync', async (req, res) => {
  try {
    logger.info('Received hpcc-tools manual sync request', {
      request: {
        method: req.method,
        path: req.originalUrl,
        body: req.body,
      },
    });

    const job = await hpccToolsQueue.add('hpccToolsSync', {
      type: HpccToolsJobType.SYNC,
    });

    res.status(202).json({
      success: true,
      queue: 'hpcc-tools',
      jobName: job.name,
      jobId: job.id,
      requestedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to enqueue hpcc-tools manual sync job', {
      error: String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to queue hpcc-tools sync job',
    });
  }
});

export { hpccToolsRoutes };
