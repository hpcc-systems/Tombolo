const path = require("path");

const models = require("../models");
const logger = require("../config/logger");

const JobMonitoring = models.jobMonitoring;
const JOB_MONITORING = "submitJobMonitoring.js";
const JOB_STATUS_POLLER = "statusPoller.js";
const ROUTINE_JOBS = "routineJobs.js";

function createJobMonitoringBreeJob({ jobMonitoring_id, cron }) {
  const uniqueJobName = `Job Monitoring - ${jobMonitoring_id}`;
  const job = {
    cron,
    name: uniqueJobName,
    path: path.join(__dirname, "..", "jobs", JOB_MONITORING),
    worker: {
      jobMonitoring_id,
    },
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
}

async function scheduleJobMonitoringOnServerStart() {
  try {
    logger.info("🕗 JOB MONITORING STARTED ...");
    const jobMonitoring = await JobMonitoring.findAll({ raw: true });
    for (let monitoring of jobMonitoring) {
      const { id, cron, isActive } = monitoring;
      if (isActive) {
        this.createJobMonitoringBreeJob({
          jobMonitoring_id: id,
          cron,
        });
      }
    }
  } catch (err) {
    logger.error(err);
  }
}

async function scheduleJobStatusPolling() {
  logger.info("📢 STATUS POLLING SCHEDULER STARTED...");

  try {
    let jobName = "job-status-poller-" + new Date().getTime();

    this.bree.add({
      name: jobName,
      interval: "20s",
      path: path.join(__dirname, "..", "jobs", JOB_STATUS_POLLER),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    this.bree.start(jobName);
  } catch (err) {
    logger.error(err);
  }
}

module.exports = {
  createJobMonitoringBreeJob,
  scheduleJobMonitoringOnServerStart,
  scheduleJobStatusPolling,
};
