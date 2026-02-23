import path from 'path';
import logger from '../config/logger.js';
import { getDirname } from '../utils/polyfills.js';
import { JOB_EXTENSION } from '../utils/jobExtension.js';

const __dirname = getDirname(import.meta.url);
const INTEGRATION_CREATION = `integrationCreation.${JOB_EXTENSION}`;

async function createIntegrationCreationJob(this: any): Promise<void> {
  const uniqueJobName = `Integration Creation Job`;
  const job = {
    interval: '60s',
    name: uniqueJobName,
    path: path.join(__dirname, '..', 'jobs', INTEGRATION_CREATION),
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
  logger.info('📈 INTEGRATION CREATION JOB STARTED ...');
}

export { createIntegrationCreationJob };
