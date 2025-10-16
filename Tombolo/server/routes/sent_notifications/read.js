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
const { sendSuccess, sendError } = require('../../utils/response');

// Create a new sent notification
router.post('/', validate(validateCreateSentNotification), async (req, res) => {
  try {
    const response = await SentNotification.create(
      { ...req.body, createdBy: req.user.id },
      { raw: true }
    );
    return sendSuccess(
      res,
      response,
      'Sent notification created successfully',
      201
    );
  } catch (err) {
    logger.error('createSentNotification: ', err);
    return sendError(res, 'Failed to save sent notification', 500);
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
      return sendSuccess(
        res,
        notifications,
        'Sent notifications retrieved successfully'
      );
    } catch (err) {
      logger.error('getSentNotifications: ', err);
      return sendError(res, 'Failed to get sent notifications', 500);
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
        return sendError(res, 'Sent notification not found', 404);
      }
      return sendSuccess(
        res,
        notification,
        'Sent notification retrieved successfully'
      );
    } catch (err) {
      logger.error('getSentNotification: ', err);
      return sendError(res, 'Failed to get sent notification', 500);
    }
  }
);

// Delete a single sent notification
router.delete(
  '/:id',
  validate(validateDeleteSentNotification),
  async (req, res) => {
    try {
      const deletedCount = await SentNotification.destroy({
        where: { id: req.params.id },
      });
      if (deletedCount === 0) {
        return sendError(res, 'Sent notification not found', 404);
      }
      return sendSuccess(res, null, 'Sent notification deleted successfully');
    } catch (err) {
      logger.error('deleteSentNotification: ', err);
      return sendError(res, 'Failed to delete sent notification', 500);
    }
  }
);

// Delete multiple sent notifications
router.delete(
  '/',
  validate(validateBulkDeleteSentNotifications),
  async (req, res) => {
    try {
      const deletedCount = await SentNotification.destroy({
        where: { id: req.body.ids },
      });
      return sendSuccess(
        res,
        { deletedCount },
        'Sent notifications deleted successfully'
      );
    } catch (err) {
      logger.error('bulkDeleteSentNotifications: ', err);
      return sendError(res, 'Failed to delete sent notifications', 500);
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

      return sendSuccess(
        res,
        updatedNotifications,
        'Sent notifications updated successfully'
      );
    } catch (err) {
      logger.error('updateSentNotifications: ', err);
      return sendError(res, 'Failed to update sent notifications', 500);
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
        return sendError(res, 'Sent notification not found', 404);
      }

      if (
        !notification.metaData ||
        !notification.metaData.notificationDetails
      ) {
        return sendError(res, 'No details for this notification', 404);
      }

      const templateName =
        notification.metaData.notificationDetails.templateName;
      if (!templateName) {
        return sendError(res, 'Notification template not found', 404);
      }

      const htmlCode = emailNotificationHtmlCode({
        templateName,
        data: notification.metaData.notificationDetails,
      });
      return sendSuccess(
        res,
        htmlCode,
        'Successfully fetched notification details'
      );
    } catch (err) {
      logger.error(err.message);
      return sendError(res, 'Failed to get notification html code', 500);
    }
  }
);

module.exports = router;
