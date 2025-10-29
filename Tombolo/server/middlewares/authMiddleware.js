const { body } = require('express-validator');
const {
  emailBody,
  objectBody,
  uuidParam,
  NAME_LENGTH,
  COMMENT_LENGTH,
  stringBody,
  bodyUuids,
} = require('./commonMiddleware');
const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

const logger = require('../config/logger');
const { User } = require('../models');

// Validate registration payload
const validateNewUserPayload = [
  stringBody('registrationMethod', false, {
    isIn: ['traditional', 'microsoft'],
  }),
  stringBody('firstName', { length: { ...NAME_LENGTH } }),
  stringBody('lastName', { length: { ...NAME_LENGTH } }),
  emailBody('email'),
  body('password')
    .if(body('registrationMethod').equals('traditional'))
    .isString()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[\W_]/)
    .withMessage('Password must contain at least one special character'),
  objectBody('metaData', true),
];

// Validate login payload
const validateLoginPayload = [emailBody('email'), stringBody('password')];

const validateEmailDuplicate = [
  async (req, res, next) => {
    const { email } = req.body;
    const message = 'Email already in use';
    const user = await User.findOne({ where: { email } });
    if (user) {
      return sendError(res, message, 400);
    }
    next();
  },
];

// Validate valid access token is present in the request header
const verifyValidTokenExists = (req, res, next) => {
  const accessToken = req.cookies.token;

  if (!accessToken) {
    logger.error('Authorization: Access token not provided');
    return sendError(res, 'Access token not provided', 401);
  }

  try {
    // Verify the token (checks for tampering and expiration)
    jwt.verify(accessToken, process.env.JWT_SECRET);

    // Attach token to req object for further processing in the controller
    req.accessToken = accessToken;
    next(); // Proceed to the controller
  } catch (err) {
    logger.error('Authorization: Invalid or expired access token', err);
    return sendError(res, 'Invalid or expired access token', 401);
  }
};

const validatePasswordResetRequestPayload = [emailBody('email')];

//validateResetPasswordPayload - comes in request body - token must be present and must be UUID, password must be present and meet password requirements
const validateResetPasswordPayload = [
  body('password')
    .isString()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[\W_]/)
    .withMessage('Password must contain at least one special character'),
];

// Verify if the request body has code -> Auth code from azure
const validateAzureAuthCode = [
  stringBody('code', false, {
    length: { min: 1, max: 1000 },
    alphaNumeric: false, // Explicitly disable alphanumeric check
  }),
];

const validateAccessRequest = [
  bodyUuids.id,
  stringBody('comment', { length: { ...COMMENT_LENGTH } }),
];

// Validate login payload
const validateEmailInBody = [emailBody('email')];
const validateResetToken = [uuidParam('token')];

// Exports
module.exports = {
  validateNewUserPayload,
  validateLoginPayload,
  validateEmailDuplicate,
  verifyValidTokenExists,
  validatePasswordResetRequestPayload,
  validateResetPasswordPayload,
  validateAzureAuthCode,
  validateAccessRequest,
  validateEmailInBody,
  validateResetToken,
};
