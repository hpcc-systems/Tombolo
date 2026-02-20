import { uuidParam } from './commonMiddleware.js';

// Validate user ID
const validateUserId = [uuidParam('id')];

// Validate session id
const validateSessionId = [uuidParam('sessionId')];

//Exports
export { validateUserId, validateSessionId };
