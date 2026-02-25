import { validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import errorFormatter from '../utils/validator.js';
import logger from '../config/logger.js';
import { sendValidationError } from '../utils/response.js';

const validateRequestBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    logger.error('Validation errors:', JSON.stringify(errors.array(), null, 2));
    logger.error('Request body:', JSON.stringify(req.body, null, 2));
    return sendValidationError(res, errors.array(), 'Validation failed');
  }
  next();
};

const validate = (
  ...rules: (ValidationChain | ValidationChain[])[]
): (ValidationChain | typeof validateRequestBody)[] => {
  const allRules = rules.flat();
  return [...allRules, validateRequestBody];
};

export { validateRequestBody, validate };
