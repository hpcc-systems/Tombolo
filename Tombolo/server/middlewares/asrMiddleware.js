const {
  stringBody,
  intBody,
  arrayBody,
  uuidQuery,
  objectBody,
  uuidParam,
  uuidBody,
  paramUuids,
} = require('./commonMiddleware');

const createUpdateDomainValidations = [
  stringBody('name'),
  intBody('severityThreshold'),
  arrayBody('severityAlertRecipients'),
  arrayBody('monitoringTypeIds', true),
  uuidQuery('monitoringTypeIds.*', true),
];

const validateCreateDomain = [
  stringBody('region'),
  ...createUpdateDomainValidations,
  objectBody('createdBy'),
];

const validateUpdateDomain = [
  paramUuids.id,
  ...createUpdateDomainValidations,
  objectBody('updatedBy'),
];

const validateDeleteDomain = [uuidParam('id')];

const createUpdateProductValidations = [
  stringBody('name'),
  stringBody('shortCode'),
  stringBody('tier'),
  arrayBody('domainIds', true),
  uuidBody('domainIds.*', true),
];

const validateCreateProduct = [
  ...createUpdateProductValidations,
  objectBody('createdBy'),
];

const validateUpdateProduct = [
  paramUuids.id,
  ...createUpdateProductValidations,
  objectBody('updatedBy'),
];

const validateDeleteProduct = [paramUuids.id];

const validateGetDomainsForMonitoringType = [uuidParam('monitoringTypeId')];

const validateGetCategoriesForDomain = [uuidParam('domainId')];

module.exports = {
  validateCreateDomain,
  validateUpdateDomain,
  validateDeleteDomain,
  validateCreateProduct,
  validateUpdateProduct,
  validateDeleteProduct,
  validateGetDomainsForMonitoringType,
  validateGetCategoriesForDomain,
};
