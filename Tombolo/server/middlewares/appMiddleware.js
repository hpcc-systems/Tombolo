const {
  DESCRIPTION_LENGTH,
  stringQuery,
  uuidBody,
  regexBody,
  TITLE_REGEX,
  stringBody,
  bodyUuids,
  queryUuids,
} = require('./commonMiddleware');

const validateGetAppByUsername = [stringQuery('user_name')];

const validateGetAppById = [queryUuids.app_id];

const validateSaveApp = [
  regexBody('title', false, { regex: TITLE_REGEX }),
  stringBody('description', false, { length: { ...DESCRIPTION_LENGTH } }),
  regexBody('visibility', false, { regex: /^[a-zA-Z]/ }),
];

const validateUnshareApp = [bodyUuids.applicationId, stringBody('username')];

const validateExportApp = [bodyUuids.id];

module.exports = {
  validateGetAppByUsername,
  validateGetAppById,
  validateSaveApp,
  validateUnshareApp,
  validateExportApp,
};
