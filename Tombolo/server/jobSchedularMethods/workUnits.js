const path = require('path');
const { fetch_workunit_interval } = require('../config/monitorings.js');
const logger = require('../config/logger');

const WORK_UNIT_QUERY_FILE_NAME = 'workunitQuery.js';

function createWorkUnitsJob() {
  try {
    const jobName = 'workunit-history-query-' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: fetch_workunit_interval,
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'workUnitHistory',
        WORK_UNIT_QUERY_FILE_NAME
      ),
      worker: {
        workerData: {
          jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info('WorkUnit history query job initialized');
  } catch (err) {
    logger.error('Failed to add WorkUnit history query job', err);
  }
}

module.exports = {
  createWorkUnitsJob,
};
