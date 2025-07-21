const path = require('path');
const logger = require('../config/logger');

const ARCHIVE_DATA_FILE_NAME = 'archiveData.js';

function createDataArchiveJob() {
  try {
    let jobName = 'archive-data' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: '1 days',
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'archive',
        ARCHIVE_DATA_FILE_NAME
      ),
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

module.exports = {
  createDataArchiveJob,
};
