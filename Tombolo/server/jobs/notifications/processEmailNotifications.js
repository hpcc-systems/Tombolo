// Packages
const { Op } = require("sequelize");

//Local Imports
const models = require("../../models");
const logger = require("../../config/logger");
const {
  sendEmail,
  retryOptions: { maxRetries },
} = require("../../config/emailConfig");
const {
  updateNotificationQueueOnError,
} = require("./notificationsHelperFunctions");
const emailNotificationHtmlCode = require("../../utils/emailNotificationHtmlCode");

const NotificationQueue = models.notification_queue;
const SentNotification = models.sent_notifications;

(async () => {
  try {
    const now = Date.now();
    let notifications;
    const notificationsToBeSent = []; // Notification that meets the criteria to be sent
    const successfulDelivery = [];

    // Get notifications with attempt count less than maxRetries and type email
    try {
      notifications = await NotificationQueue.findAll({
        where: {
          type: "email",
          attemptCount: { [Op.lt]: maxRetries },
        },
        raw: true,
      });
    } catch (err) {
      logger.error(err.message);
      return;
    }

    // Sort out notifications that meet the criteria to be sent
    for (let notification of notifications) {
      const { deliveryType, reTryAfter, lastScanned, deliveryTime } =
        notification;

      // Check if it meets the criteria to be sent
      if (
        (deliveryType === "immediate" && (reTryAfter < now || !reTryAfter)) ||
        (deliveryType === "scheduled" && (reTryAfter < now || !reTryAfter)) ||
        (deliveryType === "scheduled" &&
          deliveryTime < now &&
          deliveryTime > lastScanned)
      ) {
        notificationsToBeSent.push(notification);
      }
    }

    // If there are no notifications to be sent - return
    if (notificationsToBeSent.length === 0) {
      return;
    }

    // If there are notifications to be sent - send the emails
    for (let notification of notificationsToBeSent) {
      const {
        metaData,
        attemptCount,
        id: notificationQueueId,
        notificationOrigin,
        templateName,
      } = notification;

      try {
        //Common email details applicable for all emails
        const commonEmailDetails = {
          receiver: metaData?.mainRecipients?.join(",") || "",
          cc: metaData?.cc?.join(",") || "",
          subject: metaData.subject,
        };

        //E-mail payload
        let emailPayload;

        // Notification origin is manual - send the email as it is
        if (notificationOrigin === "manual") {
          emailPayload = {
            notificationQueueId,
            ...commonEmailDetails,
            ...metaData,
            plainTextBody: metaData.body,
          };
        } else {
          // If notification origin is not manual, render email body with template
          const emailBody = emailNotificationHtmlCode({
            templateName,
            data: metaData,
          });
          emailPayload = {
            notificationQueueId,
            ...commonEmailDetails,
            ...metaData,
            htmlBody: emailBody,
          };

          // Send email
          const emailResponse = await sendEmail({ ...emailPayload });

          // Assume success - if no error is thrown
          successfulDelivery.push({ ...emailPayload, templateName });
        }
      } catch (error) {
        // If sending fails update the notification queue
        logger.error(error.message);

        // Update notification queue
        await updateNotificationQueueOnError({
          notificationId: notificationQueueId,
          attemptCount,
          notification,
          error,
        });
      }
    }

    // Update last scanned
    try {
      await NotificationQueue.update({ lastScanned: now }, { where: {} });
    } catch (error) {
      logger.error(error.message);
    }

    //Update sent notifications table
    try {
      // clean successfully delivered notifications
      for (let notification of successfulDelivery) {
        const notificationCopy = { ...notification };
        delete notificationCopy.htmlBody;
        delete notificationCopy.notificationQueueId;

        notificationCopy.searchableNotificationId = notification.notificationId;
        (notificationCopy.notificationChannel = "email"),
          (notificationCopy.notificationTitle = notification.subject),
          (notificationCopy.applicationId = notification.applicationId),
          (notificationCopy.status = "Pending Review"),
          (notificationCopy.createdBy = { name: "System" }),
          (notificationCopy.createdAt = now),
          (notificationCopy.updatedAt = now),
          (notificationCopy.metaData = { notificationDetails: notification }),
          await SentNotification.create(notificationCopy);
      }
    } catch (error) {
      logger.error(error.message);
    }

    // Bulk delete the sent notifications form notification queue
    try {
      const successfulDeliveryIds = successfulDelivery.map(
        ({ notificationQueueId }) => notificationQueueId
      );

      await NotificationQueue.destroy({
        where: { id: successfulDeliveryIds },
      });
    } catch (err) {
      logger.error(err.message);
    }
  } catch (error) {
    logger.error(error.message);
  }
})();

/* NOTES
1. new Date() - gives local time
2. new Date().toISOString() - gives UTC time in ISO 8601 format
3. Sequelize by default stores the date in UTC format
4. Sequelize by default returns the date in local time
5. Gotcha - If you console.log new Date() in node.js environment, It will log UTC time in ISO 8601 format. 
   It is because node.js internally calls .toISOString() on the date object before logging it.
*/
