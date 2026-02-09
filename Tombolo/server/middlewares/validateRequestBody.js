import { validationResult } from 'express-validator';
import errorFormatter from '../utils/validator.js';
import logger from '../config/logger.js';
import { sendValidationError } from '../utils/response.js';

const validateRequestBody = (req, res, next) => {
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    logger.error('Validation errors:', JSON.stringify(errors.array(), null, 2));
    logger.error('Request body:', JSON.stringify(req.body, null, 2));
    return sendValidationError(res, errors.array(), 'Validation failed');
  }
  next();
};

const validate = (...rules) => {
  const allRules = rules.flat();
  return [...allRules, validateRequestBody];
};

export { validateRequestBody, validate };
