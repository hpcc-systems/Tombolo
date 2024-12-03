const {  param, validationResult } = require("express-validator");
const logger = require("../config/logger");

// Validate user ID
const validateUserId = [
  param("id").isUUID(4).withMessage("User ID must be a valid UUID"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(`Delete user : ${errors.array()[0].msg}`);
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    next();
  },
];

// Validate session id
const validateSessionId = [
  param("sessionId").isUUID(4).withMessage("Session ID must be a valid UUID"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(`Destroy active sessions : ${errors.array()[0].msg}`);
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }
    next();
  },
];

//Exports
module.exports = { validateUserId, validateSessionId };
