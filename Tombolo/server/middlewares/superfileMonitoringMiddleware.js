const {
  bodyUuids,
  cronBody,
  uuidBody,
  paramUuids,
  uuidParam,
} = require('./commonMiddleware');

const validateCreateUpdateSuperfileMonitoring = [
  bodyUuids.application_id,
  cronBody('cron'),
  uuidBody('cluster_id', true),
];

const validateAppIdParam = [paramUuids.application_id];
const validateDeleteSuperfileMonitoring = [uuidParam('superfileMonitoringId')];
const validateToggleSuperfileMonitoring = [paramUuids.id];
const validateGetSuperfileMonitoring = [uuidParam('file_monitoring_id')];

module.exports = {
  validateCreateUpdateSuperfileMonitoring,
  validateAppIdParam,
  validateDeleteSuperfileMonitoring,
  validateToggleSuperfileMonitoring,
  validateGetSuperfileMonitoring,
};
