const {
  bodyUuids,
  stringBody,
  objectBody,
  paramUuids,
  arrayBody,
  dateTimeBody,
} = require('./commonMiddleware');

const validateCreateSentNotification = [
  bodyUuids.applicationId,
  stringBody('notificationOrigin'),
  stringBody('notificationChannel'),
  stringBody('notificationTitle'),
  objectBody('recipients', true),
  stringBody('status'),
  stringBody('createdBy'),
  objectBody('metaData', true),
  dateTimeBody('notifiedAt', true),
];

const validateGetSentNotificationByAppId = [paramUuids.applicationId];
const validateGetSentNotificationById = [
  paramUuids.applicationId,
  paramUuids.id,
];
const validateDeleteSentNotification = [paramUuids.id];
const validateBulkDeleteSentNotifications = [...bodyUuids.arrayIds];
const validateUpdateSentNotifications = [arrayBody('ids')];
const validateBodyId = [bodyUuids.id];

module.exports = {
  validateCreateSentNotification,
  validateGetSentNotificationByAppId,
  validateGetSentNotificationById,
  validateDeleteSentNotification,
  validateBulkDeleteSentNotifications,
  validateUpdateSentNotifications,
  validateBodyId,
};
