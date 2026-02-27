import path from 'path';
import logger from '../config/logger.js';
import { getDirname } from '../utils/polyfills.js';
import { resolveJobPath } from './jobPathResolver.js';

const ARCHIVE_DATA_FILE_NAME = 'archiveData.js';

const __dirname = getDirname(import.meta.url);

function createDataArchiveJob(this: any): void {
  try {
    let jobName = 'archive-data' + new Date().getTime();
    const defaultDistPath = path.join(
      __dirname,
      '..',
      '..',
      'dist',
      'jobs',
      'archive',
      ARCHIVE_DATA_FILE_NAME.replace('.ts', '.js')
    );
    this.bree.add({
      name: jobName,
      interval: '1 days',
      path: resolveJobPath(defaultDistPath),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info('Data archive job initialized ...');
  } catch (err) {
    logger.error('Failed to add data archive job', err);
  }
}

export { createDataArchiveJob };
