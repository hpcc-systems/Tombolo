const { idParam, requiredUuidParam } = require('./commonMiddleware');

// Validate user ID
const validateUserId = [idParam];

// Validate session id
const validateSessionId = [requiredUuidParam('sessionId')];

//Exports
module.exports = { validateUserId, validateSessionId };
