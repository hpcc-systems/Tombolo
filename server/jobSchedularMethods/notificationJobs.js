
const path = require("path");
const logger = require("../config/logger");
const PROCESS_EMAIL_NOTIFICATIONS = path.join("notifications", "processEmailNotifications.js");
const PROCESS_TEAMS_NOTIFICATIONS = path.join("notifications", "processTeamsNotifications.js");

async function scheduleEmailNotificationProcessing() {
  try {
    let jobName = "email-notification-processing-" + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: "60s", // Make it 120 seconds in production
      path: path.join(__dirname, "..", "jobs", PROCESS_EMAIL_NOTIFICATIONS),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    this.bree.start(jobName);
    logger.info("🔔 E-MAIL NOTIFICATION PROCESSING STARTED ...");
  } catch (err) {
    console.error(err);
  }
}

async function scheduleTeamsNotificationProcessing() {
  try {
    let jobName = "teams-notification-processing-" + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: "60s", // Make it 120 seconds in production
      path: path.join(__dirname, "..", "jobs", PROCESS_TEAMS_NOTIFICATIONS),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    this.bree.start(jobName);
    logger.info("🔔 TEAMS NOTIFICATION PROCESSING STARTED ...");
  } catch (err) {
    console.error(err);
  }
}



module.exports = {
  scheduleEmailNotificationProcessing,
  scheduleTeamsNotificationProcessing,
};