import express from 'express';
const router = express.Router();
import { validate } from '../middlewares/validateRequestBody.js';
import {
  validateCreateSentNotification,
  validateGetSentNotificationByAppId,
  validateGetSentNotificationById,
  validateDeleteSentNotification,
  validateBulkDeleteSentNotifications,
  validateUpdateSentNotifications,
  validateBodyId,
} from '../middlewares/sentNotificationMiddleware.js';

//Local imports
import {
  createSentNotification,
  getSentNotifications,
  getSentNotification,
  getNotificationHtml,
  deleteSentNotification,
  deleteSentNotifications,
  updateSentNotifications,
} from '../controllers/sentNotificationController.js';

// Get notification HTML (re-rendered from jobs templates)
router.post(
  '/getNotificationHtmlCode',
  validate(validateBodyId),
  getNotificationHtml
);

// Create a new sent notification
router.post(
  '/',
  validate(validateCreateSentNotification),
  createSentNotification
);

// Get all sent notifications
router.get(
  '/:applicationId',
  validate(validateGetSentNotificationByAppId),
  getSentNotifications
);

// Get a single sent notification
router.get(
  '/:applicationId/:id',
  validate(validateGetSentNotificationById),
  getSentNotification
);

// Delete a single sent notification
router.delete(
  '/:id',
  validate(validateDeleteSentNotification),
  deleteSentNotification
);

// Delete multiple sent notifications
router.delete(
  '/',
  validate(validateBulkDeleteSentNotifications),
  deleteSentNotifications
);

// Update single or multiple sent notifications
router.patch(
  '/',
  validate(validateUpdateSentNotifications),
  updateSentNotifications
);

export default router;
