import {
  bodyUuids,
  booleanBody,
  uuidBody,
  paramUuids,
  objectBody,
} from './commonMiddleware.js';

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

export {
  validateIntegrationDetails,
  validateToggleStatus,
  validateUpdateIntegrationSettings,
};
