// const {
//   stringBody,
//   regexBody,
//   bodyUuids,
//   uuidBody,
//   booleanBody,
//   objectBody,
//   paramUuids,
// } = require('./commonMiddleware');
//
// const approvedByRegex = /^[a-zA-Z0-9_]+$/;
//
// const createUpdateTeamsHookValidations = [
//   regexBody('name', false, { regex: /^[a-zA-Z0-9_ ()-]+$/ }),
//   stringBody('url'),
//   booleanBody('approved', true),
//   regexBody('approvedBy', true, { regex: approvedByRegex }),
//   objectBody('metaData', true),
// ];
//
// const validateCreateMsTeamsHook = [
//   ...createUpdateTeamsHookValidations,
//   uuidBody('lastModifiedBy'),
//   bodyUuids.createdBy,
// ];
//
// const validateUpdateMsTeamsHook = [
//   bodyUuids.id,
//   ...createUpdateTeamsHookValidations,
//   regexBody('lastModifiedBy', false, { regex: /^[a-zA-Z0-9_ ]+$/ }),
// ];
//
// const validateDeleteMsTeamsHook = [paramUuids.id];
//
// module.exports = {
//   validateCreateMsTeamsHook,
//   validateUpdateMsTeamsHook,
//   validateDeleteMsTeamsHook,
// };
