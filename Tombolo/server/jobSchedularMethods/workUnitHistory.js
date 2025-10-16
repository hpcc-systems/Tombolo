const path = require('path');
const { work_unit_history_interval } = require('../config/monitorings.js');
const logger = require('../config/logger');

const WORK_UNIT_HISTORY_FILE_NAME = 'workunitQuery.js';

function createWorkUnitHistoryJob() {
  try {
    const jobName = 'workunit-history-' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: work_unit_history_interval,
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'workUnitHistory',
        WORK_UNIT_HISTORY_FILE_NAME
      ),
      worker: {
        workerData: {
          jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info('WorkUnit history job initialized');
  } catch (err) {
    logger.error('Failed to add WorkUnit history job', err);
  }
}

module.exports = {
  createWorkUnitHistoryJob,
};
