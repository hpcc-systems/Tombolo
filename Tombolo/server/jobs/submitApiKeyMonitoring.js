const { notify } = require('../routes/notifications/email-notification');
const { parentPort } = require('worker_threads');
const logger = require('../config/logger');
const { ApiKey, MonitoringNotification } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { emailBody } = require('./messageCards/notificationTemplate');

(async () => {
  try {
    const apiKeys = await ApiKey.findAll({
      where: { expired: false },
      raw: true,
    });

    const sentNotifications = [];

    //loop through keys checking for expiration and usage limits
    for (let i = 0; i < apiKeys.length; i++) {
      await keyCheck(apiKeys[i], sentNotifications);
    }
    if (sentNotifications.length > 0) {
      try {
        await MonitoringNotification.bulkCreate(sentNotifications);
      } catch (err) {
        logger.error(err);
      }
    }
  } catch (err) {
    logger.error(err);
  } finally {
    parentPort ? parentPort.postMessage('done') : process.exit(0);
  }
})();

const keyCheck = async (key, sentNotifications) => {
  const metaDifference = [];

  //destructure necessary items to check
  const {
    name,
    expirationDate,
    application_id,
    expired,
    metaData: { Usage, UsageLimit, emails },
  } = key;

  //other check variables
  const currentDate = new Date().getTime();
  const usagePercentage = ((Usage / UsageLimit) * 100).toFixed(2);

  const notificationDetails = { details: { 'Key Name': name } };
  //get time left in seconds
  let timeLeft = (expirationDate - currentDate) / 1000;

  //key expired
  if (timeLeft < 0 && !expired) {
    metaDifference.push({
      attribute: 'Key Expired',
      oldValue: 'Current Date: ' + new Date().getTime().toLocaleString(),
      newValue: 'Expired On: ' + new Date(expirationDate).toLocaleDateString(),
    });

    //update key to expired status
    await ApiKey.update(
      {
        expired: true,
      },
      { where: { name: name } }
    );
  }

  //only hold on to expired keys for 180 days
  if (timeLeft < -31536000) {
    await ApiKey.destroy({ where: { name: name } });
  }

  //key has less than 1 day of duration left
  if (timeLeft < 86400) {
    metaDifference.push({
      attribute: 'Key Expires Soon',
      oldValue: 'Less Than One Day',
      newValue: 'Expires On: ' + new Date(expirationDate).toLocaleDateString(),
    });
  }

  //if usage percentage is > 90% alert user
  if (usagePercentage > 90) {
    metaDifference.push({
      attribute: 'Usage Percentage Warning',
      oldValue: usagePercentage + '%',
      newValue: 'Usage Limit: ' + UsageLimit + ' - Usage: ' + Usage,
    });
  }

  if (metaDifference.length > 0) {
    // Note - this does not cover file size not in range
    notificationDetails.value = 'API Key Warnings';
    notificationDetails.title = 'API Key Warnings ';
    notificationDetails.text = 'API Key Warnings ';
  }

  const notification_id = uuidv4();

  // E-mail notification
  if (emails && emails.length && notificationDetails.text) {
    try {
      const body = emailBody(notificationDetails, metaDifference);

      const notificationResponse = await notify({
        to: emails,
        from: process.env.EMAIL_SENDER,
        subject: notificationDetails.title,
        text: body,
        html: body,
      });
      if (notificationResponse.accepted) {
        sentNotifications.push({
          id: notification_id,
          file_name: name,
          status: 'notified',
          notifiedTo: emails,
          notification_channel: 'eMail',
          application_id,
          notification_reason: notificationDetails.value,
        });
      }
    } catch (err) {
      logger.error(err);
    }
  }
};
