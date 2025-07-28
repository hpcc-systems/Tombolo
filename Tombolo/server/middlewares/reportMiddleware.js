const {
  paramUuids,
  uuidParam,
  bodyUuids,
  stringBody,
  uuidQuery,
  regexQuery,
} = require('./commonMiddleware');

const validateApplicationId = [paramUuids.application_id];

const validateDeleteReport = [uuidParam('reportId')];

const validateReportBaselines = [
  paramUuids.application_id,
  bodyUuids.id,
  stringBody('action'),
];

const validateAssociatedDataflows = [
  uuidQuery('assetId', true, { checkFalsy: true }),
  regexQuery('type', false, { regex: /^[a-zA-Z]{1}[a-zA-Z0-9_:\-]*$/ }),
];

module.exports = {
  validateApplicationId,
  validateDeleteReport,
  validateReportBaselines,
  validateAssociatedDataflows,
};
