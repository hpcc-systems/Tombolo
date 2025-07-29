const {
  DESCRIPTION_LENGTH,
  MONITORING_NAME_LENGTH,
  COMMENT_LENGTH,
  APPROVAL_STATUSES,
  uuidBody,
  stringBody,
  objectBody,
  uuidParam,
  enumBody,
  arrayBody,
  emailBody,
} = require('./commonMiddleware');

// Creating and updating monitoring
const createOrUpdateMonitoringPayload = [
  stringBody('monitoringName', false, {
    length: { ...MONITORING_NAME_LENGTH },
  }),
  stringBody('description', false, { length: { ...DESCRIPTION_LENGTH } }),
  uuidBody('clusterId', false),
  objectBody('metaData', false),
];

// Id on request params
const monitoringIdAsParam = [uuidParam('id', false)];

// UUID on body
const monitoringIdOnBody = [uuidBody('id', false)];

// evaluateMonitoringPayload
const evaluateMonitoringPayload = [
  uuidBody('id', false),
  stringBody('approverComment', false, {
    length: { ...COMMENT_LENGTH },
  }),
  enumBody('approvalStatus', false, APPROVAL_STATUSES),
];

// Bulk update contacts
const bulkUpdateContacts = [
  arrayBody('monitoring', false),
  objectBody('monitoring.*', false),
  uuidBody('monitoring.*.id', false),
  emailBody('monitoring.*.primaryContacts', false),
  emailBody('monitoring.*.secondaryContacts', true),
  emailBody('monitoring.*.notifyContacts', true),
];

// Delete payload
const deleteMonitoringPayload = [
  arrayBody('ids', false),
  uuidBody('ids.*', false),
];

// Exports
module.exports = {
  createOrUpdateMonitoringPayload,
  monitoringIdAsParam,
  monitoringIdOnBody,
  evaluateMonitoringPayload,
  bulkUpdateContacts,
  deleteMonitoringPayload,
};
