const path = require("path");
const logger = require("../config/logger");

async function removeUnverifiedUser() {
  try {
    let jobName = "remove-unverified-users-" + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: "3600s",
      path: path.join(
        __dirname,
        "..",
        "jobs",
        "userManagement",
        "removeUnverifiedUsers.js"
      ),
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
    logger.error(err);
  }
}

async function sendPasswordExpiryEmails() {
  try {
    let jobName = "password-expiry-" + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: "30s",
      path: path.join(
        __dirname,
        "..",
        "jobs",
        "userManagement",
        "passwordExpiry.js"
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    this.bree.start(jobName);
    logger.info(
      "User management (send password expiry emails) initialized ..."
    );
  } catch (err) {
    logger.error(err);
  }
}

module.exports = {
  removeUnverifiedUser,
  sendPasswordExpiryEmails,
};
