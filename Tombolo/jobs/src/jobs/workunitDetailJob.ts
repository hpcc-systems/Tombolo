import { Job } from 'sidequest';
import { getWorkunitDetails } from '../workers/workunitHistory/wuDetails.js';
import logger from '../config/logger.js';

export class WorkunitDetailJob extends Job {
  async run() {
    try {
      //   logger.info('Starting workunit detail job', { clusterId });
      const result = await getWorkunitDetails();
      //   logger.info('Workunit detail completed', { processed: result.processed });
      return result;
    } catch (error) {
      logger.error('Workunit detail job failed', { error });
      throw error;
    }
  }
}
