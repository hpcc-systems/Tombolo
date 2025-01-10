const path = require("path");
const logger = require("../config/logger");


async function removeUnverifiedUser() {
  try {
    let jobName = "remove-unverified-users-" + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: "3600s",
      path: path.join(__dirname, "..", "jobs", "userManagement", "removeUnverifiedUsers.js"),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    this.bree.start(jobName);
    logger.info("User management (remove unverified user) initialized ...");
  } catch (err) {
    console.error(err);
  }
}


module.exports = {
  removeUnverifiedUser,
};
