const { paramUuids } = require('./commonMiddleware');

const validateCreateKey = [paramUuids.application_id];
const validateGetKeysByAppId = [paramUuids.application_id];
const validateDeleteKey = [paramUuids.id];

module.exports = {
  validateCreateKey,
  validateGetKeysByAppId,
  validateDeleteKey,
};
