import {
  DESCRIPTION_LENGTH,
  stringQuery,
  regexBody,
  TITLE_REGEX,
  stringBody,
  bodyUuids,
  queryUuids,
} from './commonMiddleware.js';

const validateGetAppByUsername = [stringQuery('user_name')];

const validateGetAppById = [queryUuids.app_id];

const validateSaveApp = [
  regexBody('title', false, { regex: TITLE_REGEX }),
  stringBody('description', false, { length: { ...DESCRIPTION_LENGTH } }),
  regexBody('visibility', false, { regex: /^[a-zA-Z]/ }),
];

const validateUnshareApp = [bodyUuids.applicationId, stringBody('username')];

const validateExportApp = [bodyUuids.id];

export {
  validateGetAppByUsername,
  validateGetAppById,
  validateSaveApp,
  validateUnshareApp,
  validateExportApp,
};
