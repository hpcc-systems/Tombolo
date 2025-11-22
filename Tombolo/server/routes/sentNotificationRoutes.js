const express = require('express');
const router = express.Router();
const { validate } = require('../middlewares/validateRequestBody');
const {
  validateCreateSentNotification,
  validateGetSentNotificationByAppId,
  validateGetSentNotificationById,
  validateDeleteSentNotification,
  validateBulkDeleteSentNotifications,
  validateUpdateSentNotifications,
  validateBodyId,
} = require('../middlewares/sentNotificationMiddleware');

//Local imports
const {
  createSentNotification,
  getSentNotifications,
  getSentNotification,
  deleteSentNotification,
  deleteSentNotifications,
  updateSentNotifications,
  getNotificationHtml,
} = require('../controllers/sentNotificationController');

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

// Get notification html code
router.post(
  '/getNotificationHtmlCode',
  validate(validateBodyId),
  getNotificationHtml
);

module.exports = router;
