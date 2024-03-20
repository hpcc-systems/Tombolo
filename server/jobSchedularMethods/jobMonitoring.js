const MONITOR_JOBS_FILE_NAME = 'monitorJobs.js'
const path = require('path');
const logger = require('../config/logger');

async function startJobMonitoring() {
  try {
    let jobName = "job-monitoring" + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: "10s", // Make it 120 seconds in production
      path: path.join(__dirname, "..", "jobs", "jobMonitoring", MONITOR_JOBS_FILE_NAME),
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

 

module.exports = {
    startJobMonitoring
}
