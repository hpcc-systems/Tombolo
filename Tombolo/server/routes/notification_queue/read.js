const express = require('express');
const router = express.Router();

//Local imports
const logger = require('../../config/logger');
const { NotificationQueue } = require('../../models');
const { validate } = require('../../middlewares/validateRequestBody');
const { sendSuccess, sendError } = require('../../utils/response');
const {
  validateCreateNotificationQueue,
  validatePatchNotificationQueue,
  validateDeleteNotificationQueue,
} = require('../../middlewares/notificationQueueMiddleware');

// Create a new notification
router.post(
  '/',
  validate(validateCreateNotificationQueue),
  async (req, res) => {
    try {
      const response = await NotificationQueue.create(req.body, { raw: true });
      return sendSuccess(res, response, 'Notification created successfully');
    } catch (err) {
      logger.error('createNotificationQueue: ', err);
      return sendError(res, 'Failed to save notification');
    }
  }
);

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await NotificationQueue.findAll();
    return sendSuccess(
      res,
      notifications,
      'Notifications retrieved successfully'
    );
  } catch (err) {
    logger.error('getNotificationQueue: ', err);
    return sendError(res, 'Failed to get notifications');
  }
});

// Patch a single notification
router.patch(
  '/',
  validate(validatePatchNotificationQueue),
  async (req, res) => {
    try {
      const updatedRows = await NotificationQueue.update(req.body, {
        where: { id: req.body.id },
        returning: true,
      });

      if (updatedRows[0] === 0) {
        return sendError(res, 'Notification not found', 404);
      }

      const updatedNotification = await NotificationQueue.findByPk(req.body.id);
      return sendSuccess(
        res,
        updatedNotification,
        'Notification updated successfully'
      );
    } catch (err) {
      logger.error('patchNotificationQueue: ', err);
      return sendError(res, 'Failed to update notification');
    }
  }
);

// Delete a single notification
router.delete(
  '/:id',
  validate(validateDeleteNotificationQueue),
  async (req, res) => {
    try {
      await NotificationQueue.destroy({ where: { id: req.params.id } });
      return sendSuccess(res, null, 'Notification deleted successfully');
    } catch (err) {
      logger.error('deleteNotificationQueue: ', err);
      return sendError(res, 'Failed to delete notification');
    }
  }
);

module.exports = router;
