import {
  queryUuids,
  uuidQuery,
  uuidBody,
  regexBody,
  bodyUuids,
} from './commonMiddleware.js';

const validateIndexList = [
  queryUuids.application_id,
  uuidQuery('cluster_id', true),
];

const validateSaveIndex = [
  uuidBody('id', true),
  uuidBody('index.basic.application_id'),
  regexBody('index.basic.title', false, { regex: /[a-zA-Z][a-zA-Z0-9_:.-]/ }),
];

const validateIndexDetails = [queryUuids.app_id, uuidQuery('index_id')];

const validateDeleteIndex = [uuidBody('indexId'), bodyUuids.application_id];

export {
  validateIndexList,
  validateSaveIndex,
  validateIndexDetails,
  validateDeleteIndex,
};
