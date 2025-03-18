const path = require("path");
const {
  job_monitoring_interval,
  intermediate_job_monitoring_interval,
  job_punctuality_monitoring_interval,
} = require("../config/monitorings");
const logger = require("../config/logger");
const {
  generateTimeSlotsForJobMonitoring,
  generateIntervalString,
} = require("./jobSchedularUtils.js");

// Constants
const MONITOR_JOBS_FILE_NAME = "monitorJobs.js";
const MONITOR_INTERMEDIATE_JOBS_FILE_NAME = "monitorIntermediateStateJobs.js";
const MONITOR_JOBS_JOB_PUNCTUALITY_FILE_NAME = "monitorJobPunctuality.js";

// Job monitoring
// Job monitoring interval
const jobMonitoringTimeSlots = generateTimeSlotsForJobMonitoring({
  interval: job_monitoring_interval,
});
const humanReadableIntervalForJobMonitoring = generateIntervalString({
  timeSlots: jobMonitoringTimeSlots,
});

// Job monitoring bree job
async function startJobMonitoring() {
  try {
    let jobName = "job-monitoring" + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: "1m", // For development
      // interval: humanReadableIntervalForJobMonitoring,
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
    logger.info("Job Monitoring initialized ...");
  } catch (err) {
    logger.error(err.message);
  }
}

// Intermediate jobs monitoring
// Intermediate jobs monitoring interval
const intermediateJobMonitoringTimeSlots = generateTimeSlotsForJobMonitoring({
  interval: intermediate_job_monitoring_interval,
});
const humanReadableIntervalForIntermediateJobMonitoring =
  generateIntervalString({
    timeSlots: intermediateJobMonitoringTimeSlots,
  });

// Intermediate jobs monitoring bree job
async function startIntermediateJobsMonitoring() {
  try {
    let jobName = "intermediate-state-jobs-monitoring" + new Date().getTime();
    this.bree.add({
      name: jobName,
      // interval: "20s", // For development
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
    logger.info("Intermediate job monitoring initialized ...");
  } catch (err) {
    logger.error(err.message);
  }
}

// Job punctuality monitoring
// Job punctuality monitoring interval
const jobPunctualityMonitoringTimeSlots = generateTimeSlotsForJobMonitoring({
  interval: job_punctuality_monitoring_interval,
});
const humanReadableIntervalForJobPunctualityMonitoring = generateIntervalString(
  {
    timeSlots: jobPunctualityMonitoringTimeSlots,
  }
);

// Job punctuality monitoring bree job
async function startJobPunctualityMonitoring() {
  try {
    let jobName = "job-punctuality-monitoring" + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: "30s", // For development
      // interval: humanReadableIntervalForJobPunctualityMonitoring,
      path: path.join(
        __dirname,
        "..",
        "jobs",
        "jobMonitoring",
        MONITOR_JOBS_JOB_PUNCTUALITY_FILE_NAME
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info("Job punctuality monitoring initialized ...");
  } catch (err) {
    logger.error(err.message);
  }
}

module.exports = {
  startJobMonitoring,
  startIntermediateJobsMonitoring,
  startJobPunctualityMonitoring,
};
