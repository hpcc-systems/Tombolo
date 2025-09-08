const e = require('express');
const {
  DESCRIPTION_LENGTH,
  MONITORING_NAME_LENGTH,
  COMMENT_LENGTH,
  uuidBody,
  stringBody,
  arrayBody,
  objectBody,
  regexBody,
  booleanBody,
  bodyUuids,
  paramUuids,
  emailBody,
} = require('./commonMiddleware');

const usersRegex = /^(?:[a-zA-Z][a-zA-Z0-9_:.\-]*|\*)$/;

const createUpdateValidations = [
  bodyUuids.applicationId,
  stringBody('monitoringName', false, {
    length: { ...MONITORING_NAME_LENGTH },
  }),
  stringBody('description', false, { length: { ...DESCRIPTION_LENGTH } }),
  uuidBody('clusterId'),
  objectBody('metaData'),
  arrayBody('metaData.users', true),
  regexBody('metaData.users.*', true, { regex: usersRegex }),
];

const validateUpdateFileMonitoring = [
  paramUuids.id,
  ...createUpdateValidations,
];
const validateCreateFileMonitoring = [...createUpdateValidations];
const validateGetFileMonitoringById = [paramUuids.id];

const validateEvaluateFileMonitoring = [
  ...bodyUuids.arrayIds,
  stringBody('approverComment', false, { length: { ...COMMENT_LENGTH } }),
  stringBody('approvalStatus'),
  booleanBody('isActive', true),
];

const validateToggleStatus = [...bodyUuids.arrayIds, booleanBody('isActive')];

const validateBulkDelete = [...bodyUuids.arrayIds];

const validateBulkUpdate = [
  arrayBody('updatedData', false),
  uuidBody('updatedData.*.id', false),
  objectBody('updatedData.*.metaData.contacts', false),
];

const validateGetFileMonitoringByAppId = [paramUuids.applicationId];

module.exports = {
  validateUpdateFileMonitoring,
  validateCreateFileMonitoring,
  validateGetFileMonitoringById,
  validateEvaluateFileMonitoring,
  validateToggleStatus,
  validateBulkDelete,
  validateBulkUpdate,
  validateGetFileMonitoringByAppId,
};
