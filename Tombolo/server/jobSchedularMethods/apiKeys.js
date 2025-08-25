const path = require('path');

const logger = require('../config/logger');

const APIKEY_MONITORING = 'submitApiKeyMonitoring.js';

/**
 * Schedule key check job.
 * This function adds a job to the job scheduler to check the keys at specific intervals.
 * @async
 * @function scheduleKeyCheck
 * @memberof module:jobSchedularMethods/apiKeys
 * @throws {Error} If an error occurs while scheduling the job.
 */

async function scheduleKeyCheck() {
  try {
    let jobName = 'key-check-' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: 'at 05:30am also at 05:30pm',
      path: path.join(__dirname, '..', 'jobs', APIKEY_MONITORING),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    this.bree.start(jobName);
    logger.info('API key monitoring initialized ...');
  } catch (err) {
    logger.error('apiKeys - scheduleKeyCheck: ', err);
  }
}

module.exports = {
  scheduleKeyCheck,
};
