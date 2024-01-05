const path = require("path");
const logger = require("../config/logger");

const FLAG_JOBS_TO_RUN_TODAY = "flagJobsToRunToday.js";
const ROUTINE_JOBS_STATUS = "routineJobsStatus.js";

async function flagJobsToRunToday() {
  const uniqueJobName = `Flag Jobs To Run Today`;
  const job = {
    cron: "0 0 * * *",
    name: uniqueJobName,
    path: path.join(__dirname, "..", "jobs", FLAG_JOBS_TO_RUN_TODAY),
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
  logger.info("⛳ FLAGGING JOBS THAT ARE SCHEDULED FOR TODAY ...");
}

// Check if a jobs that are supposed to run today have already run today.
async function checkRoutineJobsStatus() {
  logger.info("📢 POOLING STARTED FOR ROUTINE JOBS");

  try {
    let jobName = "routine-Jobs-poller-" + new Date().getTime();

    this.bree.add({
      name: jobName,
      interval: "20s", //TODO -  Increase to few hrs
      path: path.join(__dirname, "..", "jobs", ROUTINE_JOBS_STATUS),
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
  flagJobsToRunToday,
  checkRoutineJobsStatus,
};
