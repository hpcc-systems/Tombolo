const {
  stringParam,
  bodyUuids,
  stringBody,
  objectBody,
  uuidParam,
} = require('./commonMiddleware');

const monitoringId = [bodyUuids.id];

const validateCreateMonitoring = [
  stringBody('name'),
  objectBody('createdBy', true),
];

const validateDeleteMonitoring = [uuidParam.id];

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
