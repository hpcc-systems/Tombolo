import express from 'express';
const router = express.Router();

//Local imports
import { validate } from '../middlewares/validateRequestBody.js';
import {
  validateCreateNotificationQueue,
  validatePatchNotificationQueue,
  validateDeleteNotificationQueue,
} from '../middlewares/notificationQueueMiddleware.js';
import {
  createNotificationQueue,
  getNotifications,
  updateNotificationQueue,
  deleteNotificationQueue,
} from '../controllers/notificationQueueController.js';

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

export default router;
