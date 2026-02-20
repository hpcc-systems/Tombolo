import { queryUuids, stringQuery, uuidBody } from './commonMiddleware.js';

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

export {
  validateGetNotifications,
  validateNotificationByType,
  validateDeleteNotificationByType,
  validateDeleteNotifications,
  validatePutUpdateNotification,
};
