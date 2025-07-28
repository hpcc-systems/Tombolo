const {
  stringBody,
  dateBody,
  intBody,
  objectBody,
  bodyUuids,
  paramUuids,
} = require('./commonMiddleware');

const createPatchNotificationQueueValidations = [
  stringBody('cron', true),
  dateBody('lastScanned', true),
  intBody('attemptCount', true),
  stringBody('failureMessage', true),
  stringBody('createdBy'),
];

const validateCreateNotificationQueue = [
  // body("type").notEmpty().withMessage("Notification medium Type is required"),
  stringBody('deliveryType'),
  ...createPatchNotificationQueueValidations,
  objectBody('metaData'),
];

const validatePatchNotificationQueue = [
  bodyUuids.id,
  stringBody('type'),
  stringBody('sendSchedule'),
  ...createPatchNotificationQueueValidations,
  objectBody('metaData', true),
];

const validateDeleteNotificationQueue = [paramUuids.id];

module.exports = {
  validateCreateNotificationQueue,
  validatePatchNotificationQueue,
  validateDeleteNotificationQueue,
};
