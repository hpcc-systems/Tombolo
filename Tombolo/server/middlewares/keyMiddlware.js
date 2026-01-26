import { paramUuids } from './commonMiddleware.js';

const validateCreateKey = [paramUuids.application_id];
const validateGetKeysByAppId = [paramUuids.application_id];
const validateDeleteKey = [paramUuids.id];

export { validateCreateKey, validateGetKeysByAppId, validateDeleteKey };
