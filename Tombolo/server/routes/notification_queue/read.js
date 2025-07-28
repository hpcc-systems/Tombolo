const express = require('express');
const router = express.Router();

//Local imports
const logger = require('../../config/logger');
const { notification_queue: NotificationQueue } = require('../../models');
const { validate } = require('../../middlewares/validateRequestBody');
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
      return res.status(200).send(response);
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Failed to save notification');
    }
  }
);

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await NotificationQueue.findAll();
    return res.status(200).json(notifications);
  } catch (err) {
    logger.error(err);
    return res.status(500).send('Failed to get notifications');
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
        return res.status(404).send('Notification not found');
      }

      const updatedNotification = await NotificationQueue.findByPk(req.body.id);
      return res.status(200).send(updatedNotification);
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Failed to update notification');
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
      return res.status(200).send('success');
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Failed to delete notification');
    }
  }
);

module.exports = router;
