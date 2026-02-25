import {
  stringBody,
  arrayBody,
  emailBody,
  objectBody,
  stringParam,
  paramUuids,
} from './commonMiddleware.js';

const createUpdateClusterValidations = [
  stringBody('username', true, {
    alphaNumeric: false,
  }),
  arrayBody('adminEmails', true),
  emailBody('adminEmails.*', true),
];

// Validate the input for creating a cluster
const validateAddClusterInputs = [
  stringBody('name'),
  ...createUpdateClusterValidations,
  stringBody('password', true, { length: { max: 75 } }),
  objectBody('metaData', true),
];

// Validate the id
const validateClusterId = [paramUuids.id];

// Validate the input for updating a cluster
const validateUpdateClusterInputs = [
  paramUuids.id,
  ...createUpdateClusterValidations,
];

// Validate name for blind ping
const validateClusterPingPayload = [
  stringBody('name'),
  stringBody('username', true, {
    alphaNumeric: false,
  }),
  stringBody('password', true),
];

const validateQueryData = [stringParam('queryData')];

export {
  validateAddClusterInputs,
  validateClusterId,
  validateUpdateClusterInputs,
  validateClusterPingPayload,
  validateQueryData,
};
