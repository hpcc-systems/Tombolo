const { body, param, query } = require('express-validator');

const NAME_LENGTH = { min: 2, max: 50 };
const DESCRIPTION_LENGTH = { min: 10, max: 500 };
const MONITORING_NAME_LENGTH = { min: 3, max: 255 };
const COMMENT_LENGTH = { min: 4, max: 200 };
const EMAIL_LENGTH = { max: 100 };
const PASSWORD_LENGTH = { min: 8, max: 75 };

/**
 * @typedef {Object} Validator
 * @property {() => Validator} isAlphanumeric
 * @property {(values: any[]) => Validator} isIn
 * @property {(options: { min?: number, max?: number }) => Validator} isLength
 * @property {(message: string) => Validator} withMessage
 */

/**
 * @typedef {Object} ValidationOptions
 * @property {string} [msg] - Custom error message
 * @property {boolean} [alphaNumeric] - Require alphanumeric input
 * @property {string[]} [isIn] - Allowed values for the field
 * @property {number} [min] - Minimum length
 * @property {number} [max] - Maximum length
 * @property {number} [arrMin] - Minimum length for an array (Handled in specific array functions)
 */

/**
 * Factory for validation middleware. Allows extending validators in the future
 * @param {(field: string) => string} defaultMessageFn - Function to generate a default error message
 * @returns {(validationFn: (field: string, ...args: any[]) => Validator) => (field: string, options?: ValidationOptions, ...args: any[]) => Validator}
 */
const createValidationFactory = defaultMessageFn => {
  return validationFn =>
    (field, options = {}, ...args) => {
      let validator = validationFn(field, ...args);
      const message = options.msg || defaultMessageFn(field);

      if (options.alphaNumeric) {
        validator = validator
          .isAlphanumeric()
          .withMessage(`${field} must be a alphanumeric`);
      }

      if (options.isIn) {
        validator = validator
          .isIn(options.isIn)
          .withMessage(`${field} must be one of ${options.isIn}`);
      }

      if (options.min || options.max) {
        const min = options.min || 1;
        const max = options.max || 500;
        validator = validator
          .isLength({
            min,
            max,
          })
          .withMessage(
            `Invalid ${field}. Must be between ${min} and ${max} characters`
          );
      }

      return validator.withMessage(message);
    };
};
const defaultMessage = field => `Invalid ${field}`;
const createMiddleware = createValidationFactory(defaultMessage);

// eslint-disable-next-line no-unused-vars
const requiredStringBody = createMiddleware((field, options = {}) =>
  body(field).notEmpty().withMessage(`${field} is required`).isString()
);
const optionalStringBody = (field, options = {}) =>
  body(field)
    .optional({
      checkFalsy: options.checkFalsy || true,
      nullable: options.nullable || false,
    })
    .isString();

const requiredStringQuery = createMiddleware(field =>
  query(field).notEmpty().withMessage(`${field} is required`).isString()
);
// eslint-disable-next-line no-unused-vars
const requiredStringParam = createMiddleware((field, options = {}) =>
  param(field).notEmpty().withMessage(`${field} is required`).isString()
);

const requiredUuidBody = createMiddleware(field => body(field).isUUID(4));
const requiredUuidParam = createMiddleware(field => param(field).isUUID(4));
const requiredUuidQuery = createMiddleware(field => query(field).isUUID(4));
const optionalUuidBody = optionalStringBody;

// Common validation patterns
const idParam = requiredUuidParam('id');
const idBody = requiredUuidBody('id');
const idQuery = requiredUuidQuery('id');

const application_idParam = requiredUuidParam('application_id');
const application_idBody = requiredUuidBody('application_id');
const application_idQuery = requiredUuidQuery('application_id');
const applicationIdParam = requiredUuidParam('applicationId');
const applicationIdBody = requiredUuidBody('applicationId');
const applicationIdQuery = requiredUuidQuery('applicationId');

const appIdBody = requiredUuidBody('app_id');
const appIdQuery = requiredUuidQuery('app_id');

const clusterIdParam = requiredUuidParam('clusterId');
const clusterIdBody = requiredUuidBody('clusterId');
const clusterIdQuery = requiredUuidQuery('clusterId');
const cluster_idParam = requiredUuidParam('cluster_id');
const cluster_idBody = requiredUuidBody('cluster_id');
const cluster_idQuery = requiredUuidQuery('cluster_id');

const requiredStringRegex = createMiddleware(field =>
  body(field).matches(/^[a-zA-Z]{1}[a-zA-Z0-9_: .\-]*$/)
);
const requiredEmailBody = createMiddleware(field =>
  body(field).isEmail().isLength(EMAIL_LENGTH)
);
const optionalEmailBody = createMiddleware(field =>
  body(field).optional().isEmail().isLength(EMAIL_LENGTH)
);

const requiredBoolean = createMiddleware(field => body(field).isBoolean());
const requiredBooleanQuery = createMiddleware(field =>
  query(field).isBoolean()
);
const optionalBoolean = createMiddleware(field =>
  body(field).optional().isBoolean()
);
const requiredNumeric = createMiddleware(field => body(field).isNumeric());
const requiredInt = createMiddleware(field => body(field).isInt());
const requiredArray = createMiddleware((field, options = {}) => {
  if (options && options.arrMin)
    return body(field).isArray({ min: options.arrMin });
  return body(field).isArray();
});
const optionalArray = createMiddleware((field, options = {}) => {
  let validator = body(field).optional({ nullable: options.nullable || false });
  if (options && options.arrMin)
    return validator.isArray({ min: options.arrMin });
  return validator.isArray();
});
const requiredObject = createMiddleware(field =>
  body(field).isObject().withMessage(`${field} must be an object`)
);
const optionalObject = createMiddleware((field, options = {}) =>
  body(field)
    .optional({ nullable: options.nullable || false })
    .isObject()
    .withMessage(`${field} must be an object`)
);

const requiredCronBody = createMiddleware(field =>
  body(field).custom(value => {
    const valArray = value.split(' ');
    if (valArray.length > 5) {
      throw new Error(
        `Expected number of cron parts 5, received ${valArray.length}`
      );
    } else {
      return Promise.resolve('Good to go');
    }
  })
);

module.exports = {
  idParam,
  idBody,
  idQuery,
  clusterIdParam,
  clusterIdBody,
  clusterIdQuery,
  application_idParam,
  application_idBody,
  application_idQuery,
  applicationIdParam,
  applicationIdBody,
  applicationIdQuery,
  appIdBody,
  appIdQuery,
  optionalUuidBody,
  requiredStringBody,
  optionalStringBody,
  requiredStringRegex,
  requiredEmailBody,
  optionalEmailBody,
  requiredStringQuery,
  requiredBoolean,
  requiredBooleanQuery,
  requiredArray,
  optionalArray,
  requiredObject,
  optionalObject,
  requiredUuidBody,
  requiredUuidParam,
  requiredUuidQuery,
  requiredNumeric,
  optionalBoolean,
  requiredCronBody,
  cluster_idParam,
  cluster_idBody,
  cluster_idQuery,
  requiredStringParam,
  NAME_LENGTH,
  DESCRIPTION_LENGTH,
  MONITORING_NAME_LENGTH,
  COMMENT_LENGTH,
  PASSWORD_LENGTH,
  requiredInt,
};
