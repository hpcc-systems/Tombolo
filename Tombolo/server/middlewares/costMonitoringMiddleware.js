const {
  DESCRIPTION_LENGTH,
  MONITORING_NAME_LENGTH,
  COMMENT_LENGTH,
  uuidBody,
  stringBody,
  arrayBody,
  objectBody,
  regexBody,
  TITLE_REGEX,
  numericBody,
  uuidParam,
  booleanBody,
  bodyUuids,
  paramUuids,
} = require('./commonMiddleware');

const createUpdateValidations = [
  bodyUuids.applicationId,
  stringBody('monitoringName', false, {
    length: { ...MONITORING_NAME_LENGTH },
  }),
  stringBody('description', false, { length: { ...DESCRIPTION_LENGTH } }),
  arrayBody('clusterIds'),
  objectBody('metaData'),
  arrayBody('metaData.users'),
  regexBody('metaData.users.*', false, { regex: TITLE_REGEX }),
  objectBody('metaData.notificationMetaData'),
  arrayBody('metaData.notificationMetaData.primaryContacts'),
  numericBody('metaData.notificationMetaData.notificationCondition'),
];

const validateUpdateCostMonitoring = [bodyUuids.id, ...createUpdateValidations];
const validateCreateCostMonitoring = [...createUpdateValidations];
const validateDeleteCostMonitoring = [paramUuids.id];
const validateGetCostMonitoringById = [paramUuids.id];

const validateEvaluateCostMonitoring = [
  ...bodyUuids.arrayIds,
  stringBody('approverComment', false, { length: { ...COMMENT_LENGTH } }),
  stringBody('approvalStatus'),
  booleanBody('isActive'),
];

const validateToggleStatus = [...bodyUuids.arrayIds, stringBody('action')];

const validateBulkDelete = [...bodyUuids.arrayIds];

const validateBulkUpdate = [
  arrayBody('costMonitorings'),
  uuidBody('costMonitorings.*.id'),
  objectBody('costMonitorings.*.metaData'),
  arrayBody('costMonitorings.*.metaData.users'),
  objectBody('costMonitorings.*.metaData.notificationMetaData'),
  arrayBody('costMonitorings.*.metaData.notificationMetaData.primaryContacts'),
  numericBody(
    'costMonitorings.*.metaData.notificationMetaData.notificationCondition'
  ),
];

const validateGetCostMonitoringByAppId = [uuidParam('applicationId')];

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
