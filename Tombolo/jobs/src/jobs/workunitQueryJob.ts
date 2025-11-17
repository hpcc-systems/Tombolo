import { Job } from 'sidequest';
import { workunitQuery } from '../workers/workunitHistory/wuQuery.js';
import logger from '../config/logger.js';

export class WorkunitQueryJob extends Job {
  async run() {
    try {
      //   logger.info('Starting workunit query job', { clusterId });
      const result = await workunitQuery();
      //   logger.info('Workunit query completed', { processed: result.processed });
      return result;
    } catch (error) {
      logger.error('Workunit query job failed', { error });
      throw error;
    }
  }
}
