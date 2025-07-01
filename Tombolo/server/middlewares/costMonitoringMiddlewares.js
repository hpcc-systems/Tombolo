const { body, param } = require('express-validator');

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

module.exports = {
  validateUpdateCostMonitoring,
  validateCreateCostMonitoring,
  validateDeleteCostMonitoring,
  validateGetCostMonitoringById,
};
