import { Job } from 'bullmq';
import { workunitQuery } from './handlers/wuQuery.js';
import { getWorkunitDetails } from './handlers/wuDetails.js';
import { wuHistoryJobType } from '../../config/constants.js';
import logger from '../../config/logger.js';

// Job data interface - exported for type checking
export interface WorkunitHistoryJobData {
  type: wuHistoryJobType;
  [key: string]: unknown;
}

// Job processor function - exported as default for BullMQ worker threads
export default async function processWorkunitHistoryJob(
  job: Job<WorkunitHistoryJobData>
) {
  const { type } = job.data;

  logger.info(`Processing ${type} job`, { jobId: job.id });

  try {
    switch (type) {
      case wuHistoryJobType.QUERY:
        logger.info('Starting workunit query job');
        await workunitQuery();
        logger.info('Workunit query completed');
        break;

      case wuHistoryJobType.DETAILS:
        logger.info('Starting workunit detail job');
        await getWorkunitDetails();
        logger.info('Workunit detail completed');
        break;

      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    return { success: true, type };
  } catch (error) {
    logger.error(`${type} job failed`, { error: String(error) });
    throw error;
  }
}
