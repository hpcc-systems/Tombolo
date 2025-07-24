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
} = require('./commonMiddleware');

const arrayIdsValidator = [arrayBody('ids'), uuidBody('ids.*')];

const createUpdateValidations = [
  uuidBody('applicationId'),
  stringBody('monitoringName', false, {
    length: { ...MONITORING_NAME_LENGTH },
  }),
  stringBody('description', false, { length: { ...DESCRIPTION_LENGTH } }),
  arrayBody('clusterIds', false),
  objectBody('metaData'),
  arrayBody('metaData.users'),
  regexBody('metaData.users.*', false, { regex: TITLE_REGEX }),
  objectBody('metaData.notificationMetaData'),
  arrayBody('metaData.notificationMetaData.primaryContacts'),
  numericBody('metaData.notificationMetaData.notificationCondition'),
];

const validateUpdateCostMonitoring = [
  uuidBody('id'),
  ...createUpdateValidations,
];
const validateCreateCostMonitoring = [...createUpdateValidations];
const validateDeleteCostMonitoring = [uuidParam('id')];
const validateGetCostMonitoringById = [uuidParam('id')];

const validateEvaluateCostMonitoring = [
  ...arrayIdsValidator,
  stringBody('approverComment', false, { length: { ...COMMENT_LENGTH } }),
  stringBody('approvalStatus'),
  booleanBody('isActive'),
];

const validateToggleStatus = [...arrayIdsValidator, stringBody('action')];

const validateBulkDelete = [...arrayIdsValidator];

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
