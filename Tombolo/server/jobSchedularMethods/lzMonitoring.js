/* eslint-disable */
const path = require('path');
const { lz_monitoring_interval } = require('../config/monitorings');
const logger = require('../config/logger');
const {
  generateTimeSlotsForJobMonitoring,
  generateIntervalString,
} = require('./jobSchedularUtils.js');

// Constants
const LZ_MONITOR_FILE_NAME = 'submitLzMonitoring.js';

const jobMonitoringTimeSlots = generateTimeSlotsForJobMonitoring({
  interval: lz_monitoring_interval,
});
const humanReadableIntervalForJobMonitoring = generateIntervalString({
  timeSlots: jobMonitoringTimeSlots,
});

// Job monitoring bree job
async function startLzMonitoring() {
  try {
    let jobName = 'job-monitoring' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: '20s', // For development
      // interval: humanReadableIntervalForJobMonitoring,
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'lzMonitoring',
        LZ_MONITOR_FILE_NAME
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info('Job Monitoring initialized ...');
  } catch (err) {
    logger.error(err.message);
  }
}

module.exports = {
  startLzMonitoring,
};
