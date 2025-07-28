const { queryUuids, stringQuery, uuidBody } = require('./commonMiddleware');

const notificationType = stringQuery('type', false, { isIn: ['JSON', 'CSV'] });
const optionalNonFalsyId = uuidBody('id', true, { checkFalsy: false });

const validateGetNotifications = [queryUuids.applicationId];
const validateNotificationByType = [queryUuids.applicationId, notificationType];
const validateDeleteNotificationByType = [
  queryUuids.applicationId,
  notificationType,
];
const validateDeleteNotifications = [optionalNonFalsyId];
const validatePutUpdateNotification = [optionalNonFalsyId];

module.exports = {
  validateGetNotifications,
  validateNotificationByType,
  validateDeleteNotificationByType,
  validateDeleteNotifications,
  validatePutUpdateNotification,
};
