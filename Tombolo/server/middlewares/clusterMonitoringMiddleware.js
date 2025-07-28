const {
  stringBody,
  uuidBody,
  cronBody,
  objectBody,
  arrayBody,
  paramUuids,
  bodyUuids,
} = require('./commonMiddleware');

const createUpdateClusterMonitoringValidations = [
  stringBody('name'),
  bodyUuids.application_id,
  bodyUuids.cluster_id,
  cronBody('cron'),
  objectBody('metaData'),
];

const validateCreateClusterMonitoring = [
  //Validation middleware
  ...createUpdateClusterMonitoringValidations,
];

const validateUpdateClusterMonitoring = [
  uuidBody('id'),
  ...createUpdateClusterMonitoringValidations,
];

const validateGetClusterMonitorings = [paramUuids.application_id];

const validateGetClusterMonitoring = [paramUuids.id];

const validateDeleteClusterMonitoring = [paramUuids.id];

const validateStartStopClusterMonitoring = [paramUuids.id];

const validateGetClusterMonitoringEngines = [paramUuids.cluster_id];

const validateGetClusterUsage = [paramUuids.cluster_id, arrayBody('engines')];

module.exports = {
  validateCreateClusterMonitoring,
  validateGetClusterMonitorings,
  validateGetClusterMonitoring,
  validateDeleteClusterMonitoring,
  validateStartStopClusterMonitoring,
  validateUpdateClusterMonitoring,
  validateGetClusterMonitoringEngines,
  validateGetClusterUsage,
};
