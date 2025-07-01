const express = require('express');
const router = express.Router();
const { body, check } = require('express-validator');

//Local imports
const logger = require('../../config/logger');
const models = require('../../models');
const { validationResult } = require('express-validator');

//Constants
const NotificationQueue = models.notification_queue;

// Create new notification
router.post(
  '/',
  [
    // body("type").notEmpty().withMessage("Notification medium Type is required"),
    body('deliveryType').notEmpty().withMessage('Send schedule is required'),
    body('cron')
      .optional()
      .isString()
      .withMessage('Cron must be a string if provided'),
    body('lastScanned')
      .optional()
      .isDate()
      .withMessage('Last scanned must be a date if provided'),
    body('attemptCount')
      .optional()
      .isInt()
      .withMessage('Attempt count must be an integer if provided'),
    body('failureMessage')
      .optional()
      .isString()
      .withMessage('Failure message must be a string if provided'),
    body('createdBy').notEmpty().withMessage('Created by is required'),
    body('metaData')
      .notEmpty()
      .isObject()
      .withMessage('Meta data must be an object if provided'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

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
  [
    body('id').isUUID().withMessage('ID must be a valid UUID'),
    body('type').notEmpty().withMessage('Type is required'),
    body('sendSchedule').notEmpty().withMessage('Send schedule is required'),
    body('cron')
      .optional()
      .isString()
      .withMessage('Cron must be a string if provided'),
    body('lastScanned')
      .optional()
      .isDate()
      .withMessage('Last scanned must be a date if provided'),
    body('attemptCount')
      .optional()
      .isInt()
      .withMessage('Attempt count must be an integer if provided'),
    body('failureMessage')
      .optional()
      .isString()
      .withMessage('Failure message must be a string if provided'),
    body('createdBy').notEmpty().withMessage('Created by is required'),
    body('metaData')
      .optional()
      .isObject()
      .withMessage('Meta data must be an object if provided'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

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
  [check('id', 'Invalid id').isUUID()],
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
