import {
  stringParam,
  bodyUuids,
  stringBody,
  objectBody,
  paramUuids,
} from './commonMiddleware.js';

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

export {
  validateCreateMonitoring,
  validateDeleteMonitoring,
  validateUpdateMonitoring,
  validateGetMonitoringByTypeName,
};
