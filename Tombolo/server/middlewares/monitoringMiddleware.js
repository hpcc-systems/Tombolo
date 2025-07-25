const {
  stringParam,
  bodyUuids,
  stringBody,
  objectBody,
  paramUuids,
} = require('./commonMiddleware');

const monitoringId = [bodyUuids.id];

const validateCreateMonitoring = [
  stringBody('name'),
  objectBody('createdBy', true),
];

const validateDeleteMonitoring = [paramUuids.id];

const validateUpdateMonitoring = [
  ...monitoringId,
  stringBody('name'),
  objectBody('updatedBy'),
];

const validateGetMonitoringByTypeName = [stringParam('monitoringTypeName')];

module.exports = {
  validateCreateMonitoring,
  validateDeleteMonitoring,
  validateUpdateMonitoring,
  validateGetMonitoringByTypeName,
};
