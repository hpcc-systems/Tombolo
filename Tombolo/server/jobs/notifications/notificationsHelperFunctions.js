const { NotificationQueue } = require('../../models');
const logger = require('../../config/logger');

const {
  retryOptions: { maxRetries, retryDelays },
} = require('../../config/emailConfig');

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
        failureMessage: { err: error.message },
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
  calculateRetryAfter,
  updateNotificationQueueOnError,
};
