import { validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import errorFormatter from '../utils/validator.js';
import logger from '../config/logger.js';
import { sendValidationError } from '../utils/response.js';

const createValidateRequestBody =
  (useFirstErrorAsMessage = false) =>
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array();
      logger.error(
        'Validation errors:',
        JSON.stringify(formattedErrors, null, 2)
      );
      logger.error('Request body:', JSON.stringify(req.body, null, 2));

      const message =
        useFirstErrorAsMessage && formattedErrors.length > 0
          ? formattedErrors[0]
          : 'Validation failed';

      return sendValidationError(res, formattedErrors, message);
    }
    next();
  };

const validateRequestBody = createValidateRequestBody(false);
const validateRequestBodyWithFirstErrorMessage =
  createValidateRequestBody(true);

const buildValidateChain = (
  validationMiddleware: typeof validateRequestBody,
  ...rules: (ValidationChain | ValidationChain[])[]
): (ValidationChain | typeof validateRequestBody)[] => {
  const allRules = rules.flat();
  return [...allRules, validationMiddleware];
};

const validate = (
  ...rules: (ValidationChain | ValidationChain[])[]
): (ValidationChain | typeof validateRequestBody)[] => {
  return buildValidateChain(validateRequestBody, ...rules);
};

const validateWithFirstErrorMessage = (
  ...rules: (ValidationChain | ValidationChain[])[]
): (ValidationChain | typeof validateRequestBody)[] => {
  return buildValidateChain(validateRequestBodyWithFirstErrorMessage, ...rules);
};

export {
  validateRequestBody,
  validateRequestBodyWithFirstErrorMessage,
  validate,
  validateWithFirstErrorMessage,
};
