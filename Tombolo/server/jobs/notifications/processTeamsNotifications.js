// Modules
const { Op } = require("sequelize");
const axios = require("axios");
const path = require("path");

//Local Imports
const models = require("../../models");
const logger = require("../../config/logger");
const {retryOptions: { maxRetries, retryDelays }} = require("../../config/emailConfig");
const {updateNotificationQueueOnError} = require("./notificationsHelperFunctions");
const NotificationQueue = models.notification_queue;
const TeamsHook = models.teams_hook;
const Notification = models.monitoring_notifications;

(async () => {
  const notificationsToBeSent = []; // That meets the criteria to be sent
  const now = Date.now();
  const successfulDelivery=[]

  try {
    let notifications;

    try {
      notifications = await NotificationQueue.findAll({
        where: {
          type: "msTeams",
          attemptCount: { [Op.lt]: maxRetries },
        },
      });
    } catch (err) {
      logger.error(err);
      return;
    }

    // Loop through all notifications and check if it meets the criteria to be sent
    for (let notification of notifications) {
      const {
        id,
        notificationOrigin,
        deliveryType,
        attemptCount,
        metaData,
        reTryAfter,
        lastScanned,
        deliveryTime,
      } = notification;
      const msTeamsDetails = metaData?.msTeamsDetails;

      if (
        (deliveryType === "immediate" && (reTryAfter < now || !reTryAfter)) ||
        (deliveryType === "scheduled" && (reTryAfter < now || !reTryAfter)) ||
        (deliveryType === "scheduled" &&
          deliveryTime < now &&
          deliveryTime > lastScanned)
      ) {
        try {
          //Common teams details
          const commonMsTeamsDetails = {
            receiver: msTeamsDetails?.recipients,
            notificationId: id,
            attemptCount,
          };

          // If notification origin is manual, send the email as it is
          if (notificationOrigin === "manual") {
            notificationsToBeSent.push({
              ...commonMsTeamsDetails,
              messageCard: `**${msTeamsDetails.subject}**\n\n${msTeamsDetails.htmlBody}`,
            });
          } else {
            //Import correct card file
            const getTemplate = require(path.join(
              "..",
              "..",
              "notificationTemplates",
              "teams",
              `${notificationOrigin}.js`
            ));

            //Get message card
            const messageCard = getTemplate({
              notificationData: msTeamsDetails.data,
            });

            notificationsToBeSent.push({
              ...commonMsTeamsDetails,
              messageCard,
            });
          }
        } catch (error) {
          logger.error(error);
          //If error occurs - increment attempt count, update reTryAfter
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
      const { receiver, messageCard, notificationId, attemptCount } =
        notification;
      try {
        // Receiver is array of  hook IDs - get URL from database
        const hooksObj = await TeamsHook.findAll({
          where: { id: receiver },
          attributes: ["url"],
          raw: true,
        });

        // Teams end points
        const hooks = hooksObj.map((h) => h.url);
        const requests = hooks.map((h) => axios.post(h, messageCard));

        const response = await Promise.allSettled(requests);

        for (res of response) {
          // If delivered - destroy the notification
          if (res.status === "fulfilled") {
            // Destroy the notification from queue
            try {
              await NotificationQueue.destroy({
                where: { id: notificationId },
              });
            } catch (err) {
              logger.error(err);
            }
            successfulDelivery.push(notificationId);
          } else {
            logger.error({ err: res.reason });
            //Update the notification queue if failed to send
            await updateNotificationQueueOnError({
              attemptCount,
              notificationId,
              notification,
              error: { message: res.reason },
            });
          }
        }
      } catch (err) {
        logger.error(err);
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
