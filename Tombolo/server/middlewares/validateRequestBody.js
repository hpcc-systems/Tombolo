import { validationResult } from 'express-validator';
import validatorUtil from '../utils/validator.js';
import logger from '../config/logger.js';
import { sendValidationError } from '../utils/response.js';

const validateRequestBody = (req, res, next) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    logger.error('Bad Request', errors.array());
    return sendValidationError(res, errors.array(), 'Validation failed');
  }
  next();
};

const validate = (...rules) => {
  const allRules = rules.flat();
  return [...allRules, validateRequestBody];
};

export { validateRequestBody, validate };
