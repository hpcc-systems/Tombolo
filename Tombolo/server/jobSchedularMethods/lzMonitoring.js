/* eslint-disable */
const path = require('path');
const {
  lz_monitoring_interval,
  lz_file_count_monitoring_interval,
} = require('../config/monitorings');
const logger = require('../config/logger');
const {
  generateTimeSlotsForJobMonitoring,
  generateIntervalString,
} = require('./jobSchedularUtils.js');

// Constants
const LZ_FILE_MOVEMENT_MONITORING_FILE_NAME = 'lzFileMovementMonitoring.js';
const LZ_FILE_COUNT_MONITORING_FILE_NAME = 'lzFileCountMonitoring.js';

const jobMonitoringTimeSlots = generateTimeSlotsForJobMonitoring({
  interval: lz_monitoring_interval,
});
const humanReadableIntervalForJobMonitoring = generateIntervalString({
  timeSlots: jobMonitoringTimeSlots,
});

const fileCountMonitoringTimeSlots = generateTimeSlotsForJobMonitoring({
  interval: lz_file_count_monitoring_interval,
});
const humanReadableIntervalForFileCountMonitoring = generateIntervalString({
  timeSlots: fileCountMonitoringTimeSlots,
});

// Job monitoring bree job
async function startLzFileMovementMonitoring() {
  try {
    let jobName =
      'landing-zone-file-movement-monitoring' + new Date().getTime();
    this.bree.add({
      name: jobName,
      // interval: '20s', // For development
      interval: humanReadableIntervalForJobMonitoring,
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'lzMonitoring',
        LZ_FILE_MOVEMENT_MONITORING_FILE_NAME
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info('Landing zone file movement job initialized ...');
  } catch (err) {
    logger.error(err.message);
  }
}

// File count monitoring bree job
async function startLzFileCountMonitoring() {
  try {
    let jobName = 'landing-zone-file-count-monitoring' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: '20s', // For development
      // interval: humanReadableIntervalForFileCountMonitoring,
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'lzMonitoring',
        LZ_FILE_COUNT_MONITORING_FILE_NAME
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info('Landing zone file count job initialized ...');
  } catch (err) {
    logger.error(err.message);
  }
}

module.exports = {
  startLzFileMovementMonitoring,
  startLzFileCountMonitoring,
};
