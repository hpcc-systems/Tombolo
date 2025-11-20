const {
  DESCRIPTION_LENGTH,
  MONITORING_NAME_LENGTH,
  COMMENT_LENGTH,
  uuidBody,
  stringBody,
  objectBody,
  paramUuids,
  bodyUuids,
  booleanBody,
  enumBody,
  APPROVAL_STATUSES,
} = require('./commonMiddleware');

const createOrbitMonitoringPayloadValidations = [
  uuidBody('applicationId', false),
  stringBody('monitoringName', false, {
    length: { ...MONITORING_NAME_LENGTH },
  }),
  stringBody('description', false, { length: { ...DESCRIPTION_LENGTH } }),
  uuidBody('clusterId', false),
  objectBody('metaData'),
];

const validateAppIdInReqParam = [paramUuids.applicationId];

const validateMonitoringIdInBody = [paramUuids.id];

const validateUpdatePayload = [...createOrbitMonitoringPayloadValidations];

const deleteOrbitMonitoringPayloadValidations = [bodyUuids.arrayIds];
const monitoringTogglePayloadValidations = [
  ...bodyUuids.arrayIds,
  booleanBody('isActive'),
];

const validateMonitoringEvaluationPayload = [
  ...bodyUuids.arrayIds,
  stringBody('approverComment', false, { length: { ...COMMENT_LENGTH } }),
  enumBody('approvalStatus', false, APPROVAL_STATUSES),
  booleanBody('isActive'),
];

module.exports = {
  createOrbitMonitoringPayloadValidations,
  validateAppIdInReqParam,
  validateMonitoringIdInBody,
  validateUpdatePayload,
  deleteOrbitMonitoringPayloadValidations,
  monitoringTogglePayloadValidations,
  validateMonitoringEvaluationPayload,
};
