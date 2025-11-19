const path = require('path');
const { orbitServerMonitoringInterval } = require('../config/monitorings.js');

const logger = require('../config/logger');
const MONITOR_ORBIT_SERVER__FILE_NAME = 'monitorOrbitServer.js';

function createMonitorOrbitServerJob() {
  try {
    let jobName = 'monitor-orbit-server-' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: orbitServerMonitoringInterval,
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'orbitMonitoring',
        MONITOR_ORBIT_SERVER__FILE_NAME
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info('Orbit server monitoring initialized ...');
  } catch (err) {
    logger.error('Failed to add monitor-orbit-server job', err);
  }
}

module.exports = {
  createMonitorOrbitServerJob,
};
