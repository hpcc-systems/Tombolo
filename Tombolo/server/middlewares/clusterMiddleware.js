const {
  stringBody,
  arrayBody,
  emailBody,
  objectBody,
  stringParam,
  paramUuids,
} = require('./commonMiddleware');

const createUpdateClusterValidations = [
  stringBody('username', true, {
    alphaNumeric: true,
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
  objectBody('createdBy'),
  stringBody('createdBy.name', { length: { max: 100 } }),
  stringBody('createdBy.email'),
];

// Validate the id
const validateClusterId = [paramUuids.id];

// Validate the input for updating a cluster
const validateUpdateClusterInputs = [
  paramUuids.id,
  ...createUpdateClusterValidations,
  objectBody('updatedBy'),
  stringBody('updatedBy.name'),
  emailBody('updatedBy.email'),
];

// Validate name for blind ping
const validateClusterPingPayload = [
  stringBody('name'),
  stringBody('username', true, {
    alphaNumeric: true,
  }),
  stringBody('password', true),
];

const validateQueryData = [stringParam('queryData')];

module.exports = {
  validateAddClusterInputs,
  validateClusterId,
  validateUpdateClusterInputs,
  validateClusterPingPayload,
  validateQueryData,
};
