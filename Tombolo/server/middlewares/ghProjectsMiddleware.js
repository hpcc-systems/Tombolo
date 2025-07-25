const {
  regexBody,
  uuidBody,
  TITLE_REGEX,
  urlBody,
  queryUuids,
} = require('./commonMiddleware');

const validateCreateGhProject = [
  uuidBody('id', true),
  uuidBody('application_id'),
  regexBody('ghProject', false, { regex: TITLE_REGEX }),
  urlBody('ghLink'),
];

const validateDeleteGhProject = [queryUuids.id, queryUuids.application_id];

const validateGetGhProjects = [queryUuids.application_id];

module.exports = {
  validateCreateGhProject,
  validateDeleteGhProject,
  validateGetGhProjects,
};
