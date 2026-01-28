import {
  stringBody,
  intBody,
  arrayBody,
  uuidQuery,
  uuidParam,
  uuidBody,
  paramUuids,
} from './commonMiddleware.js';

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
];

const validateUpdateDomain = [paramUuids.id, ...createUpdateDomainValidations];

const validateDeleteDomain = [uuidParam('id')];

const createUpdateProductValidations = [
  stringBody('name'),
  stringBody('shortCode'),
  intBody('tier'),
  arrayBody('domainIds', true),
  uuidBody('domainIds.*', true),
];

const validateCreateProduct = [...createUpdateProductValidations];

const validateUpdateProduct = [
  paramUuids.id,
  ...createUpdateProductValidations,
];

const validateDeleteProduct = [paramUuids.id];

const validateGetDomainsForMonitoringType = [uuidParam('monitoringTypeId')];

const validateGetCategoriesForDomain = [uuidParam('domainId')];

export {
  validateCreateDomain,
  validateUpdateDomain,
  validateDeleteDomain,
  validateCreateProduct,
  validateUpdateProduct,
  validateDeleteProduct,
  validateGetDomainsForMonitoringType,
  validateGetCategoriesForDomain,
};
