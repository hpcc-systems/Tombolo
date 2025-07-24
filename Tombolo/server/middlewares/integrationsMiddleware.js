const {
  bodyUuids,
  booleanBody,
  uuidBody,
  paramUuids,
  objectBody,
} = require('./commonMiddleware');

const validateIntegrationDetails = [paramUuids.id];

const validateToggleStatus = [
  uuidBody('integrationId'),
  bodyUuids.application_id,
  booleanBody('active'),
];

const validateUpdateIntegrationSettings = [
  paramUuids.id,
  objectBody('integrationSettings'),
];

module.exports = {
  validateIntegrationDetails,
  validateToggleStatus,
  validateUpdateIntegrationSettings,
};
