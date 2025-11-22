const express = require('express');
const router = express.Router();

//Local imports
const { validate } = require('../middlewares/validateRequestBody');
const {
  validateCreateNotificationQueue,
  validatePatchNotificationQueue,
  validateDeleteNotificationQueue,
} = require('../middlewares/notificationQueueMiddleware');
const {
  createNotificationQueue,
  getNotifications,
  updateNotificationQueue,
  deleteNotificationQueue,
} = require('../controllers/notificationQueueController');

// Create a new notification
router.post(
  '/',
  validate(validateCreateNotificationQueue),
  createNotificationQueue
);

// Get all notifications
router.get('/', getNotifications);

// Patch a single notification
router.patch(
  '/',
  validate(validatePatchNotificationQueue),
  updateNotificationQueue
);

// Delete a single notification
router.delete(
  '/:id',
  validate(validateDeleteNotificationQueue),
  deleteNotificationQueue
);

module.exports = router;
