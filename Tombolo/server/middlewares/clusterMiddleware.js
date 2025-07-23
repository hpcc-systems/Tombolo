const {
  requiredStringBody,
  optionalStringBody,
  optionalObject,
  requiredObject,
  requiredEmailBody,
  idParam,
  optionalArray,
  optionalEmailBody,
  requiredStringParam,
} = require('./commonMiddleware');

const createUpdateClusterValidations = [
  optionalStringBody('username', { nullable: true, alphaNumeric: true }),
  optionalArray('adminEmails', { nullable: true }),
  optionalEmailBody('adminEmails.*'),
];

// Validate the input for creating a cluster
const validateAddClusterInputs = [
  requiredStringBody('name', { max: 300 }),
  ...createUpdateClusterValidations,
  optionalStringBody('password', { max: 200 }),
  optionalObject('metaData', { nullable: true }),
  requiredObject('createdBy'),
  requiredStringBody('createdBy.name', { max: 100 }),
  requiredEmailBody('createdBy.email'),
];

// Validate the id
const validateClusterId = [idParam];

// Validate the input for updating a cluster
const validateUpdateClusterInputs = [
  idParam,
  ...createUpdateClusterValidations,
  requiredObject('updatedBy'),
  requiredStringBody('updatedBy.name', { max: 100 }),
  requiredEmailBody('updatedBy.email', { max: 100 }),
];

// Validate name for blind ping
const validateClusterPingPayload = [
  requiredStringBody('name', { max: 300 }),
  optionalStringBody('username', {
    max: 200,
    alphaNumeric: true,
    nullable: true,
  }),
  optionalStringBody('password', { max: 200, nullable: true }),
];

const validateQueryData = [requiredStringParam('queryData')];

module.exports = {
  validateAddClusterInputs,
  validateClusterId,
  validateUpdateClusterInputs,
  validateClusterPingPayload,
  validateQueryData,
};
