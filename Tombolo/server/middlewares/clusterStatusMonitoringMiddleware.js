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
  uuidBody('clusterId'),
  objectBody('metaData'),
];

// Id on request params
const monitoringIdAsParam = [uuidParam('id')];

// UUID on body
const monitoringIdOnBody = [uuidBody('id')];

// evaluateMonitoringPayload
const evaluateMonitoringPayload = [
  uuidBody('id'),
  stringBody('approverComment', false, {
    length: { ...COMMENT_LENGTH },
  }),
  enumBody('approvalStatus', false, APPROVAL_STATUSES),
];

// Bulk update contacts
const bulkUpdateContacts = [
  arrayBody('monitoring'),
  objectBody('monitoring.*'),
  uuidBody('monitoring.*.id'),
  emailBody('monitoring.*.primaryContacts'),
  emailBody('monitoring.*.secondaryContacts', true),
  emailBody('monitoring.*.notifyContacts', true),
];

// Delete payload
const deleteMonitoringPayload = [arrayBody('ids'), uuidBody('ids.*')];

// Exports
module.exports = {
  createOrUpdateMonitoringPayload,
  monitoringIdAsParam,
  monitoringIdOnBody,
  evaluateMonitoringPayload,
  bulkUpdateContacts,
  deleteMonitoringPayload,
};
