// Packages
const { Op } = require('sequelize');
const axios = require('axios');

//Local Imports
const {
  NotificationQueue,
  SentNotification,
  TeamsHook,
} = require('../../models');
const logger = require('../../config/logger');
const {
  retryOptions: { maxRetries, retryDelays }, // use the same config for emails and teams
} = require('../../config/emailConfig');
const {
  updateNotificationQueueOnError,
} = require('./notificationsHelperFunctions');

(async () => {
  try {
    const now = Date.now();
    const notificationsToBeSent = []; // Notification that meets the criteria to be sent
    const successfulDelivery = [];

    // Get notifications
    let notifications = await NotificationQueue.findAll({
      where: {
        type: 'msTeams',
        attemptCount: { [Op.lt]: maxRetries },
      },
      raw: true,
    });

    // Sort out notifications that meet the criteria to be sent
    for (let notification of notifications) {
      const { deliveryType, reTryAfter, lastScanned, deliveryTime } =
        notification;

      // Check if it meets the criteria to be sent
      if (
        (deliveryType === 'immediate' && (reTryAfter < now || !reTryAfter)) ||
        (deliveryType === 'scheduled' && (reTryAfter < now || !reTryAfter)) ||
        (deliveryType === 'scheduled' &&
          deliveryTime < now &&
          deliveryTime > lastScanned)
      ) {
        notificationsToBeSent.push(notification);
      }
    }

    // push notification to teams channel
    for (let notification of notificationsToBeSent) {
      const { metaData, templateName, attemptCount } = notification;
      try {
        const hookId = metaData.teamsHooks[0]; // Only let user enter 1 hook

        const { id, url } = await TeamsHook.findOne({
          where: { id: hookId },
          raw: true,
        });

        // Based on templateName, get the teamsCardData function from the templates folder
        let teamsCardData;
        try {
          const module = await import(
            `../../notificationTemplates/teams/${templateName}.js`
          );
          teamsCardData = module.teamsCardData;
        } catch (error) {
          logger.error('processTeamsNotifications - teamsCardData: ', error);
        }

        // message card
        const card = teamsCardData({ data: metaData });
        await axios.post(url, card);
        successfulDelivery.push(notification);
      } catch (err) {
        logger.error('Failed to push teams notification to channel: ', err);
        updateNotificationQueueOnError({
          notificationId: notification.id,
          attemptCount,
          notification,
          error: err,
        });
      }
    }

    // Update last scanned
    try {
      await NotificationQueue.update({ lastScanned: now }, { where: {} });
    } catch (error) {
      logger.error(
        'processTeamsNotifications, failed to update last scanned: ',
        error
      );
    }

    //Update sent notifications table
    try {
      // clean successfully delivered notifications
      const cleanedDeliveredNotification = successfulDelivery.map(
        notification => {
          return {
            ...notification,
            searchableNotificationId: notification.metaData.notificationId,
            notificationChannel: notification.type,
            notificationTitle: notification.metaData.subject,
            applicationId: notification.metaData.applicationId,
            status: 'Pending Review',
            createdBy: { name: 'System' },
            createdAt: now,
            updatedAt: now,
          };
        }
      );
      await SentNotification.bulkCreate(cleanedDeliveredNotification);
    } catch (error) {
      logger.error(
        'processTeamsNotifications, failed to create sent notification: ',
        error
      );
    }

    // Bulk delete the sent notifications form notification queue
    try {
      await NotificationQueue.destroy({
        where: { id: successfulDelivery.map(({ id }) => id) },
      });
    } catch (err) {
      logger.error(
        'processTeamsNotifications, failed to delete sent notifications from queue table: ',
        err
      );
    }
  } catch (error) {
    logger.error('processTeamsNotifications: ', error);
  }
})();
