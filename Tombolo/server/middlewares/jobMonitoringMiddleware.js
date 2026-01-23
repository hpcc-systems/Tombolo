import {
  paramUuids,
  stringBody,
  bodyUuids,
  objectBody,
  COMMENT_LENGTH,
  arrayBody,
  uuidBody,
  booleanBody,
} from './commonMiddleware.js';

const validateParamApplicationId = [paramUuids.applicationId];
const arrayIds = [arrayBody('ids'), uuidBody('ids.*')];

const createUpdateJobMonitoringValidations = [
  stringBody('monitoringName'),
  stringBody('description'),
  stringBody('monitoringScope'),
  bodyUuids.clusterId,
  stringBody('jobName'),
  bodyUuids.applicationId,
  objectBody('metaData'),
];

const validateCreateJobMonitoring = [
  ...createUpdateJobMonitoringValidations,
  // body("isActive").isBoolean().withMessage("isActive must be a boolean"),
];

const validateUpdateJobMonitoring = [
  bodyUuids.id,
  ...createUpdateJobMonitoringValidations,
];

const validateEvaluateJobMonitoring = [
  stringBody('approverComment', false, { length: { ...COMMENT_LENGTH } }),
  ...arrayIds,
  stringBody('approvalStatus'),
  booleanBody('isActive'),
];

const validateBulkDeleteJobMonitoring = [...arrayIds];

const validateDeleteJobMonitoring = [paramUuids.id];

const validateToggleJobMonitoring = [
  ...arrayIds,
  stringBody('action', true, { isIn: ['start', 'pause'] }),
];

const validateBulkUpdateJobMonitoring = [arrayBody('metaData')];

const validateGetJobMonitoringById = [paramUuids.id];

export {
  validateCreateJobMonitoring,
  validateParamApplicationId,
  validateUpdateJobMonitoring,
  validateEvaluateJobMonitoring,
  validateBulkDeleteJobMonitoring,
  validateDeleteJobMonitoring,
  validateToggleJobMonitoring,
  validateBulkUpdateJobMonitoring,
  validateGetJobMonitoringById,
};
