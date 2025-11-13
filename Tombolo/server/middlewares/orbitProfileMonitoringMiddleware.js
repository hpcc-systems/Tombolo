const {
  DESCRIPTION_LENGTH,
  MONITORING_NAME_LENGTH,
  uuidBody,
  stringBody,
  objectBody,
  paramUuids,
} = require('./commonMiddleware');

// Common validation patterns
const createOrbitMonitoringPayloadValidations = [
  uuidBody('applicationId', false),
  stringBody('name', false, {
    length: { ...MONITORING_NAME_LENGTH },
  }),
  stringBody('description', false, { length: { ...DESCRIPTION_LENGTH } }),
  uuidBody('clusterId', false),
  objectBody('metaData'),
];

// Validate application id in req.params
const validateApplicationIdInReqParam = [paramUuids.applicationId];

// Validation arrays for different operations
// const validateUpdateOrbitProfileMonitoring = [
//   bodyUuids.id,
//   ...createUpdateValidations,
// ];
// const validateDeleteOrbitProfileMonitoring = [paramUuids.id];
// const validateGetOrbitProfileMonitoringById = [paramUuids.id];

// const validateEvaluateOrbitProfileMonitoring = [
//   ...bodyUuids.arrayIds,
//   stringBody('approverComment', false, { length: { ...COMMENT_LENGTH } }),
//   stringBody('approvalStatus'),
//   booleanBody('isActive'),
// ];

// const validateToggleStatus = [...bodyUuids.arrayIds, stringBody('action')];

// const validateBulkDelete = [...bodyUuids.arrayIds];

// const validateBulkUpdate = [
//   arrayBody('orbitProfileMonitorings'),
//   uuidBody('orbitProfileMonitorings.*.id'),
//   objectBody('orbitProfileMonitorings.*.metaData'),
//   stringBody('orbitProfileMonitorings.*.metaData.domain'),
//   stringBody('orbitProfileMonitorings.*.metaData.productCategory'),
//   stringBody('orbitProfileMonitorings.*.metaData.severity'),
//   stringBody('orbitProfileMonitorings.*.metaData.buildName'),
//   arrayBody('orbitProfileMonitorings.*.metaData.notificationConditions'),
//   arrayBody('orbitProfileMonitorings.*.metaData.primaryContactEmails'),
//   arrayBody('orbitProfileMonitorings.*.metaData.secondaryContactEmails', true),
//   arrayBody('orbitProfileMonitorings.*.metaData.notifyContactEmails', true),
// ];

// const validateGetOrbitProfileMonitoringByAppId = [paramUuids.applicationId];

module.exports = {
  createOrbitMonitoringPayloadValidations,
  validateApplicationIdInReqParam,
  // validateUpdateOrbitProfileMonitoring,
  // validateDeleteOrbitProfileMonitoring,
  // validateGetOrbitProfileMonitoringById,
  // validateEvaluateOrbitProfileMonitoring,
  // validateToggleStatus,
  // validateBulkDelete,
  // validateBulkUpdate,
  // validateGetOrbitProfileMonitoringByAppId,
};
