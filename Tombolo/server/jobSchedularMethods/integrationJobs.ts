import path from 'path';
import logger from '../config/logger.js';
import { getDirname } from '../utils/polyfills.js';

const __dirname = getDirname(import.meta.url);
const INTEGRATION_CREATION = 'integrationCreation.js';

async function createIntegrationCreationJob(this: any): Promise<void> {
  const uniqueJobName = `Integration Creation Job`;
  const job = {
    interval: '60s',
    name: uniqueJobName,
    path: path.join(
      __dirname,
      '..',
      '..',
      'dist',
      'jobs',
      INTEGRATION_CREATION
    ),
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
  logger.info('📈 INTEGRATION CREATION JOB STARTED ...');
}

export { createIntegrationCreationJob };
