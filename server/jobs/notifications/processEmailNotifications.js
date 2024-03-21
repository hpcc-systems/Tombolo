// Packages
const { Op } = require("sequelize");
const path = require("path");

//Local Imports
const models = require("../../models");
const logger = require("../../config/logger");
const {
  sendEmail,
  retryOptions: { maxRetries, retryDelays },
} = require("../../config/emailConfig");
const {
  renderEmailBody,
  updateNotificationQueueOnError,
} = require("./notificationsHelperFunctions");

const NotificationQueue = models.notification_queue;
const Notification = models.monitoring_notifications;

(async () => {
  try {
    const now = Date.now();
    let notifications;
    const notificationsToBeSent = []; // Notification that meets the criteria to be sent
    const successfulDelivery = [];

    try {
      // Get notifications
      notifications = await NotificationQueue.findAll({
        where: {
          type: "email",
          attemptCount: { [Op.lt]: maxRetries },
        },
        raw: true,
      });
    } catch (err) {
      logger.error(err);
      return;
    }

    for (let notification of notifications) {
      const {
        id,
        notificationOrigin,
        deliveryType,
        attemptCount,
        templateName,
        metaData,
        reTryAfter,
        lastScanned,
        deliveryTime,
      } = notification;
      const emailDetails = metaData?.emailDetails;

      renderEmailBody({ templateName, emailData: emailDetails.data });

      // Check if it meets the criteria to be sent
      if (
        (deliveryType === "immediate" && (reTryAfter < now || !reTryAfter)) ||
        (deliveryType === "scheduled" && (reTryAfter < now || !reTryAfter)) ||
        (deliveryType === "scheduled" &&
          deliveryTime < now &&
          deliveryTime > lastScanned)
      ) {
        try {
          console.log(emailDetails.mainRecipients);
          //Common email details
          const commonEmailDetails = {
            receiver: emailDetails?.mainRecipients?.join(",") || "",
            cc: emailDetails?.cc?.join(",") || "",
            subject: emailDetails.subject,
            notificationId: id,
            attemptCount,
          };

          // Notification origin is manual - send the email as it is
          if (notificationOrigin === "manual") {
            notificationsToBeSent.push({
              ...commonEmailDetails,
              plainTextBody: emailDetails.body,
            });
          } else {
            // If notification origin is not manual, match the template
            notificationsToBeSent.push({
              ...commonEmailDetails,
              htmlBody: renderEmailBody({
                templateName,
                emailData: emailDetails.data,
              }),
            });
          }
        } catch (error) {
          logger.error(error);
          await updateNotificationQueueOnError({
            notificationId: notification.id,
            attemptCount,
            notification,
            error,
          });
        }
      }
    }

    // If there are notifications to be sent
    for (let notification of notificationsToBeSent) {
      const {
        receiver,
        cc,
        subject,
        plainTextBody,
        htmlBody,
        notificationId,
        attemptCount,
      } = notification;

      try {
        await sendEmail({ receiver, cc, subject, plainTextBody, htmlBody });
        successfulDelivery.push(notificationId);

        // If email is sent successfully , delete the notification from the queue
        await NotificationQueue.destroy({
          where: { id: notificationId },
        });
      } catch (error) {
        // If email failed to send, update the notification queue
        logger.error(error);

        // Update notification queue
        await updateNotificationQueueOnError({
          notificationId,
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
      logger.error(error);
    }

    //Update notifications table
    //TODO - Notifications table should be refactored to accommodate ASR needs
    try {
      await Notification.bulkCreate(
        successfulDelivery.map((id) => ({ notificationQueueId: id }))
      );
    } catch (error) {
      logger.error(error);
    }
  } catch (error) {
    logger.error(error);
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
