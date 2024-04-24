const MONITOR_JOBS_FILE_NAME = 'monitorJobs.js';
const MONITOR_INTERMEDIATE_JOBS_FILE_NAME= 'monitorIntermediateStateJobs.js';
const  JOB_MONITORING_INTERVAL = 30; // in minutes
const INTERMEDIATE_JOB_MONITORING_INTERVAL = 10; // in minutes

const path = require('path');
const logger = require('../config/logger');
const {generateTimeSlotsForJobMonitoring,generateIntervalString} = require("./jobSchedularUtils.js");

// Generate schedule based on interval
const jobMonitoringTimeSlots = generateTimeSlotsForJobMonitoring({ interval: JOB_MONITORING_INTERVAL });
const humanReadableIntervalForJobMonitoring = generateIntervalString({
  timeSlots : jobMonitoringTimeSlots,
});

const intermediateJobMonitoringTimeSlots = generateTimeSlotsForJobMonitoring({
  interval: INTERMEDIATE_JOB_MONITORING_INTERVAL,
});
const humanReadableIntervalForIntermediateJobMonitoring =
  generateIntervalString({
    timeSlots: intermediateJobMonitoringTimeSlots,
  });


async function startJobMonitoring() {
  try {
    let jobName = "job-monitoring" + new Date().getTime();
    this.bree.add({
      name: jobName,
      // interval: "10s", // For development
      interval: humanReadableIntervalForJobMonitoring,
      path: path.join(
        __dirname,
        "..",
        "jobs",
        "jobMonitoring",
        MONITOR_JOBS_FILE_NAME
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info("🕗 JOB MONITORING STARTED ");
  } catch (err) {
    console.error(err);
  }
}

async function startIntermediateJobsMonitoring() {
  try {
    let jobName = "intermediate-state-jobs-monitoring" + new Date().getTime();
    this.bree.add({
      name: jobName,
      // interval: "5s", // For development
      interval: humanReadableIntervalForIntermediateJobMonitoring,
      path: path.join(
        __dirname,
        "..",
        "jobs",
        "jobMonitoring",
        MONITOR_INTERMEDIATE_JOBS_FILE_NAME
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info("🕗 INTERMEDIATE JOB MONITORING STARTED ");
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  startJobMonitoring,
  startIntermediateJobsMonitoring,
};
