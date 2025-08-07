const express = require('express');
const router = express.Router();
const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateCreateSentNotification,
  validateGetSentNotificationByAppId,
  validateGetSentNotificationById,
  validateDeleteSentNotification,
  validateBulkDeleteSentNotifications,
  validateUpdateSentNotifications,
  validateBodyId,
} = require('../../middlewares/sentNotificationMiddleware');
const moment = require('moment');
const { Op } = require('sequelize');

//Local imports
const logger = require('../../config/logger');
const { SentNotification, sequelize } = require('../../models');
const emailNotificationHtmlCode = require('../../utils/emailNotificationHtmlCode');

// Create a new sent notification
router.post('/', validate(validateCreateSentNotification), async (req, res) => {
  try {
    const response = await SentNotification.create(req.body, { raw: true });
    return res.status(200).send(response);
  } catch (err) {
    logger.error(err);
    return res.status(500).send('Failed to save sent notification');
  }
});

// Get all sent notifications
router.get(
  '/:applicationId',
  validate(validateGetSentNotificationByAppId),
  async (req, res) => {
    try {
      // Get notifications from the last 60 days only
      const sixtyDaysAgo = moment().subtract(60, 'days').toDate();

      const notifications = await SentNotification.findAll({
        where: {
          createdAt: {
            [Op.gte]: sixtyDaysAgo,
          },
        },
        order: [['createdAt', 'DESC']],
      });
      return res.status(200).json(notifications);
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Failed to get sent notifications');
    }
  }
);

// Get a single sent notification
router.get(
  '/:applicationId/:id',
  validate(validateGetSentNotificationById),
  async (req, res) => {
    try {
      const notification = await SentNotification.findByPk(req.params.id);
      if (!notification) {
        return res.status(404).send('Sent notification not found');
      }
      return res.status(200).json(notification);
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Failed to get sent notification');
    }
  }
);

// Delete a single sent notification
router.delete(
  '/:id',
  validate(validateDeleteSentNotification),
  async (req, res) => {
    try {
      await SentNotification.destroy({ where: { id: req.params.id } });
      return res.status(200).send('success');
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Failed to delete sent notification');
    }
  }
);

// Delete multiple sent notifications
router.delete(
  '/',
  validate(validateBulkDeleteSentNotifications),
  async (req, res) => {
    try {
      await SentNotification.destroy({ where: { id: req.body.ids } });
      return res.status(200).send('success');
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Failed to delete sent notifications');
    }
  }
);

// Update single or multiple sent notifications
router.patch(
  '/',
  validate(validateUpdateSentNotifications),
  async (req, res) => {
    try {
      const allNotificationToBeUpdated = [];

      // If anything that is part of metaData is to be updated - fetch existing metadata and update particular fields
      if (req.body.jiraTickets) {
        const notificationsToBeUpdated = await SentNotification.findAll({
          where: { id: req.body.ids },
        });

        // Organize all notifications to be updated the way they are to be updated
        notificationsToBeUpdated.forEach(n => {
          let updatedNotification;
          updatedNotification = {
            ...req.body,
            id: n.id,
            metaData: {
              ...n.metaData,
              asrSpecificMetaData: {
                ...n.metaData.asrSpecificMetaData,
                jiraTickets: req.body.jiraTickets,
              },
            },
          };
          delete updatedNotification.ids;
          delete updatedNotification.jiraTickets;
          allNotificationToBeUpdated.push(updatedNotification);
        });
      }

      // If no metadata is to be updated, update the rest of the fields
      if (allNotificationToBeUpdated.length > 0) {
        const transaction = await sequelize.transaction();
        try {
          for (let item of allNotificationToBeUpdated) {
            await SentNotification.update(item, { where: { id: item.id } });
          }
          await transaction.commit();
        } catch (err) {
          await transaction.rollback();
          throw new Error(err);
        }
      } else {
        await SentNotification.update(req.body, {
          where: { id: { [Op.in]: req.body.ids } },
        });
      }

      // fetch and send updated data to the client
      const updatedNotifications = await SentNotification.findAll({
        where: { id: req.body.ids },
        raw: true,
      });

      return res.status(200).json(updatedNotifications);
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Failed to update sent notifications');
    }
  }
);

// Get notification html code
router.post(
  '/getNotificationHtmlCode',
  validate(validateBodyId),
  async (req, res) => {
    try {
      const notification = await SentNotification.findByPk(req.body.id);
      if (!notification) {
        return res.status(404).send('Sent notification not found');
      }

      if (
        !notification.metaData ||
        !notification.metaData.notificationDetails
      ) {
        return res
          .status(404)
          .send({ message: 'No details for this notification', data: null });
      }

      const templateName =
        notification.metaData.notificationDetails.templateName;
      if (!templateName) {
        return res
          .status(404)
          .send({ message: 'Notification template not found', data: null });
      }

      const htmlCode = emailNotificationHtmlCode({
        templateName,
        data: notification.metaData.notificationDetails,
      });
      return res.status(200).send({
        message: 'Successfully fetched notification details',
        data: htmlCode,
      });
    } catch (err) {
      logger.error(err.message);
      return res.status(500).send('Failed to get notification html code');
    }
  }
);

module.exports = router;
