const {
  requiredUuidParam,
  requiredArray,
  requiredUuidBody,
  applicationIdBody,
  requiredStringBody,
  requiredObject,
  requiredStringRegex,
  requiredNumeric,
  idBody,
  idParam,
  requiredBoolean,
  DESCRIPTION_LENGTH,
  MONITORING_NAME_LENGTH,
  COMMENT_LENGTH,
} = require('./commonMiddleware');

const arrayIdsValidator = [
  requiredArray('ids', { msg: 'IDs must be an array' }),
  requiredUuidBody('ids.*', { msg: 'Invalid id' }),
];

const createUpdateValidations = [
  applicationIdBody,
  requiredStringBody('monitoringName', { ...MONITORING_NAME_LENGTH }),
  requiredStringBody('description', { ...DESCRIPTION_LENGTH }),
  requiredArray('clusterIds', { msg: 'Cluster IDs must be an array' }),
  requiredObject('metaData', { msg: 'metaData must be an object' }),
  requiredArray('metaData.users', { msg: 'metaData must have a users array' }),
  requiredStringRegex('metaData.users.*', { msg: 'Invalid user name' }),
  requiredObject('metaData.notificationMetaData', {
    msg: 'metaData must have a notificationMetaData object',
  }),
  requiredArray('metaData.notificationMetaData.primaryContacts'),
  requiredNumeric('metaData.notificationMetaData.notificationCondition'),
];

const validateUpdateCostMonitoring = [idBody, ...createUpdateValidations];
const validateCreateCostMonitoring = [...createUpdateValidations];
const validateDeleteCostMonitoring = [idParam];
const validateGetCostMonitoringById = [idParam];

const validateEvaluateCostMonitoring = [
  ...arrayIdsValidator,
  requiredStringBody('approverComment', {
    ...COMMENT_LENGTH,
  }),
  requiredStringBody('approvalStatus'),
  requiredBoolean('isActive'),
];

const validateToggleStatus = [
  ...arrayIdsValidator,
  requiredStringBody('action', 'action must be a string'),
];

const validateBulkDelete = [...arrayIdsValidator];

const validateBulkUpdate = [
  requiredArray('costMonitorings', { msg: 'Cost Monitoring must be an array' }),
  requiredUuidBody('costMonitorings.*.id'),
  requiredObject('costMonitorings.*.metaData'),
  requiredArray('costMonitorings.*.metaData.users'),
  requiredObject('costMonitorings.*.metaData.notificationMetaData'),
  requiredArray(
    'costMonitorings.*.metaData.notificationMetaData.primaryContacts'
  ),
  requiredNumeric(
    'costMonitorings.*.metaData.notificationMetaData.notificationCondition'
  ),
];

const validateGetCostMonitoringByAppId = [requiredUuidParam('applicationId')];

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
