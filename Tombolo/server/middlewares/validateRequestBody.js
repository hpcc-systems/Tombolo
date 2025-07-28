const { validationResult } = require('express-validator');
const validatorUtil = require('../utils/validator');
const logger = require('../config/logger');

const validateRequestBody = (req, res, next) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    logger.error('Bad Request', errors.array());
    return res.status(422).json({
      message: 'Validation failed',
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

const validate = (...rules) => {
  const allRules = rules.flat();
  return [...allRules, validateRequestBody];
};

module.exports = {
  validateRequestBody,
  validate,
};
