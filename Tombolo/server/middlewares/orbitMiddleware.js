const {
  paramUuids,
  bodyUuids,
  cronBody,
  regexParam,
} = require('./commonMiddleware');

const sharedRegex = /^[a-zA-Z0-9_.\-:\*\? ]*$/;

const validateGetOrbitsByAppId = [paramUuids.application_id];
const validateCreateOrbit = [bodyUuids.application_id, cronBody('cron')];

const validateSearchByKeyword = [
  paramUuids.application_id,
  regexParam('keyword', false, { regex: sharedRegex }),
];

const validateGetOrbitBuild = [
  regexParam('buildName', false, { regex: sharedRegex }),
];

const validateUpdateOrbitMonitor = [
  paramUuids.application_id,
  cronBody('cron'),
];

const validateToggleStatus = [paramUuids.id];
const validateDeleteOrbit = [paramUuids.id];
const validateGetOrbitById = [paramUuids.application_id, paramUuids.id];
const validateGetWorkunits = [paramUuids.application_id];
const validateUpdateList = [paramUuids.application_id];
const validateGetDomains = [paramUuids.application_id];
const validateGetProducts = [paramUuids.application_id];

module.exports = {
  validateCreateOrbit,
  validateGetOrbitsByAppId,
  validateSearchByKeyword,
  validateGetOrbitBuild,
  validateUpdateOrbitMonitor,
  validateToggleStatus,
  validateDeleteOrbit,
  validateGetOrbitById,
  validateGetWorkunits,
  validateUpdateList,
  validateGetDomains,
  validateGetProducts,
};
