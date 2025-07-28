const {
  uuidBody,
  regexBody,
  queryUuids,
  uuidQuery,
  bodyUuids,
} = require('./commonMiddleware');

const validateSaveQuery = [
  uuidBody('id', true, { checkFalsy: false }),
  uuidBody('query.basic.application_id'),
  regexBody('query.basic.name', false, {
    regex: /^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/,
  }),
];

const validateQueryList = [queryUuids.app_id];
const validateQueryDetails = [queryUuids.app_id, uuidQuery('query_id')];
const validateDeleteQuery = [bodyUuids.application_id, uuidBody('queryId')];

module.exports = {
  validateSaveQuery,
  validateQueryList,
  validateQueryDetails,
  validateDeleteQuery,
};
