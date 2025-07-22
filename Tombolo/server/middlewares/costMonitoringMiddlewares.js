const { body, param } = require('express-validator');

const arrayIdsValidator = [
  body('ids').isArray().withMessage('IDs must be an array'),
  body('ids.*').isUUID().withMessage('Invalid id'),
];

const createUpdateValidations = [
  body('applicationId')
    .isUUID(4)
    .withMessage('Application ID must be a valid UUID'),
  body('monitoringName')
    .isString()
    .withMessage('Monitoring name must be a string'),
  body('description')
    .isString()
    .withMessage('cost monitoring must have a description'),
  body('clusterIds').isArray().withMessage('Cluster IDs must be an array'),
  body('metaData').isObject().withMessage('MetaData must be an object'),
  body('metaData.users')
    .isArray()
    .withMessage('metaData must have a users array'),
  body('metaData.notificationMetaData')
    .isObject()
    .withMessage('metaData must have a notificationMetaData object'),
  body('metaData.notificationMetaData.primaryContacts')
    .isArray()
    .withMessage(
      'metaData.notificationMetaData must have a primaryContacts array'
    ),
  body('metaData.notificationMetaData.notificationCondition')
    .isNumeric()
    .withMessage(
      'metaData.notificationMetaData must have a notificationCondition'
    ),
];

const validateUpdateCostMonitoring = [
  body('id').isUUID(4).withMessage('ID must be a valid UUID'),
  ...createUpdateValidations,
];

const validateCreateCostMonitoring = [
  ...createUpdateValidations,
  body('createdBy').isObject().withMessage('createdBy must be an object'),
];

const validateDeleteCostMonitoring = [
  param('id').isUUID().withMessage('Cost Monitoring ID must be a valid UUID'),
];

const validateGetCostMonitoringById = [
  param('id').isUUID().withMessage('Cost Monitoring ID must be a valid UUID'),
];

const validateEvaluateCostMonitoring = [
  body('approverComment')
    .notEmpty()
    .isString()
    .withMessage('Approval comment must be a string')
    .isLength({ min: 4, max: 200 })
    .withMessage('Approval comment must be between 4 and 200 characters long'),
  ...arrayIdsValidator,
  body('approvalStatus')
    .notEmpty()
    .isString()
    .withMessage('Accepted must be a string'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
];

const validateToggleStatus = [
  ...arrayIdsValidator,
  body('action').notEmpty().isString().withMessage('action must be a string'),
];

const validateBulkDelete = [...arrayIdsValidator];

const validateBulkUpdate = [
  body('costMonitorings')
    .isArray()
    .withMessage('Cost Monitoring must be an array'),
  body('costMonitorings.*.id')
    .isUUID()
    .withMessage('Cost Monitoring ID must be a valid UUID'),
  body('costMonitorings.*.id')
    .isUUID()
    .withMessage('Cost Monitoring ID must be a valid UUID'),
  body('costMonitorings.*.metaData')
    .isObject()
    .withMessage('MetaData must be an object'),
  body('costMonitorings.*.metaData.users')
    .isArray()
    .withMessage('metaData must have a users array'),
  body('costMonitorings.*.metaData.notificationMetaData')
    .isObject()
    .withMessage('metaData must have a notificationMetaData object'),
  body('costMonitorings.*.metaData.notificationMetaData.primaryContacts')
    .isArray()
    .withMessage(
      'costMonitorings.*.metaData.notificationMetaData must have a primaryContacts array'
    ),
  body('costMonitorings.*.metaData.notificationMetaData.notificationCondition')
    .isNumeric()
    .withMessage(
      'metaData.notificationMetaData must have a notificationCondition'
    ),
];

const validateGetCostMonitoringByAppId = [
  param('applicationId')
    .isUUID()
    .withMessage('Application ID must be a valid UUID'),
];

module.exports = {
  validateUpdateCostMonitoring,
  validateCreateCostMonitoring,
  validateDeleteCostMonitoring,
  validateGetCostMonitoringById,
  validateEvaluateCostMonitoring,
  validateToggleStatus,
  validateBulkDelete,
  validateBulkUpdate,
  validateGetCostMonitoringByAppId,
};
