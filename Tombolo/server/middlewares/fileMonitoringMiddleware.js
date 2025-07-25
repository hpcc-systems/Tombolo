const {
  uuidBody,
  arrayBody,
  emailBody,
  cronBody,
  uuidParam,
  bodyUuids,
  paramUuids,
} = require('./commonMiddleware');

const validateCreateFileMonitoring = [
  bodyUuids.application_id,
  uuidBody('cluster_id', true),
  arrayBody('dirToMonitor', true),
  arrayBody('email', true),
  emailBody('email.*', true),
  cronBody('cron'),
];

const validateUpdateFileMonitoring = [bodyUuids.id, cronBody('cron')];
const validateGetFileMonitorings = [paramUuids.application_id];
const validateGetFileMonitoring = [uuidParam('file_monitoring_id')];
const validateDeleteFileMonitoring = [uuidParam('fileMonitoringId')];
const validateToggleFileMonitoring = [paramUuids.id];

module.exports = {
  validateCreateFileMonitoring,
  validateGetFileMonitorings,
  validateGetFileMonitoring,
  validateDeleteFileMonitoring,
  validateToggleFileMonitoring,
  validateUpdateFileMonitoring,
};
