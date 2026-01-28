import { NotificationQueue } from '../../models/index.js';
import logger from '../../config/logger.js';

import { retryOptions } from '../../config/emailConfig.js';
const { maxRetries, retryDelays } = retryOptions;

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
  _notification,
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
    logger.error('Error updating notification queue on error', updateError);
  }
}

export { calculateRetryAfter, updateNotificationQueueOnError };
