const { uuidParam } = require('./commonMiddleware');

// Validate user ID
const validateUserId = [uuidParam('id')];

// Validate session id
const validateSessionId = [uuidParam('sessionId')];

//Exports
module.exports = { validateUserId, validateSessionId };
