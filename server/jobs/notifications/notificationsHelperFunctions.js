const path = require("path");
const ejs = require("ejs");
const fs = require("fs");
const models = require("../../models");
const logger = require("../../config/logger");

const NotificationQueue = models.notification_queue;
const {
  retryOptions: { maxRetries, retryDelays },
} = require("../../config/emailConfig");

// Renders HTML template for email notification
const renderEmailBody = ({ templateName, emailData }) => {
  try {
    const templatePath = path.join(
      __dirname,
      "..",
      "..",
      "notificationTemplates",
      "email",
      `${templateName}.ejs`
    );
    const template = fs.readFileSync(templatePath, "utf-8");
    return ejs.render(template, emailData);
  } catch (err) {
    logger.error(err);
    return { error: true, message: err };
  }
};

// Function to calculate the retryAfter time
const calculateRetryAfter = ({
  attemptCount,
  retryDelays, // Configs related to emails should not be passed as params
  maxRetries,
  currentDateTime,
}) => {
  if (attemptCount === maxRetries - 1) {
    return null;
  } else {
    return new Date(currentDateTime + retryDelays[attemptCount] * 60000);
  }
};

//Update notification queue on error
async function updateNotificationQueueOnError({
  notificationId,
  attemptCount,
  notification,
  error,
}) {
  try {
    await NotificationQueue.update(
      {
        attemptCount: attemptCount + 1,
        failureMessage: { err: error.message, notification },
        reTryAfter: calculateRetryAfter({
          attemptCount,
          retryDelays: retryDelays,
          maxRetries: maxRetries,
          currentDateTime: Date.now(),
        }),
      },
      { where: { id: notificationId } }
    );
  } catch (updateError) {
    logger.error(updateError);
  }
}

module.exports = {
  renderEmailBody,
  calculateRetryAfter,
  updateNotificationQueueOnError,
};
