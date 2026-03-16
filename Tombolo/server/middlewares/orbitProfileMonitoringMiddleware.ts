import {
  DESCRIPTION_LENGTH,
  MONITORING_NAME_LENGTH,
  COMMENT_LENGTH,
  uuidBody,
  stringBody,
  objectBody,
  arrayBody,
  paramUuids,
  bodyUuids,
  booleanBody,
  enumBody,
  APPROVAL_STATUSES,
} from './commonMiddleware.js';

const createOrbitMonitoringPayloadValidations = [
  uuidBody('applicationId', false),
  stringBody('monitoringName', false, {
    length: { ...MONITORING_NAME_LENGTH },
  }),
  stringBody('description', false, { length: { ...DESCRIPTION_LENGTH } }),
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

const validateBulkUpdate = [
  arrayBody('monitorings'),
  uuidBody('monitorings.*.id'),
  objectBody('monitorings.*.metaData'),
  objectBody('monitorings.*.metaData.contacts', true),
  objectBody('monitorings.*.metaData.asrSpecificMetaData', true),
  objectBody('monitorings.*.metaData.monitoringData', true),
];

export {
  createOrbitMonitoringPayloadValidations,
  validateAppIdInReqParam,
  validateMonitoringIdInBody,
  validateUpdatePayload,
  deleteOrbitMonitoringPayloadValidations,
  monitoringTogglePayloadValidations,
  validateMonitoringEvaluationPayload,
  validateBulkUpdate,
};
