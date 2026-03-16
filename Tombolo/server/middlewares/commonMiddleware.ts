import { body, param, query, ValidationChain } from 'express-validator';
import { APPROVAL_STATUS } from '../config/constants.js';

const NAME_LENGTH = { min: 2, max: 50 };
const DESCRIPTION_LENGTH = { min: 10, max: 500 };
const MONITORING_NAME_LENGTH = { min: 3, max: 255 };
const COMMENT_LENGTH = { min: 4, max: 200 };
const EMAIL_LENGTH = { max: 100 };
const PASSWORD_LENGTH = { min: 8, max: 75 };
const DEFAULT_LENGTH = { max: 200 };
const TITLE_REGEX = /^[a-zA-Z]{1}[a-zA-Z0-9_: .-]*$/;
const APPROVAL_STATUSES = [
  APPROVAL_STATUS.APPROVED,
  APPROVAL_STATUS.REJECTED,
  APPROVAL_STATUS.PENDING,
];

/**
 * Configuration options for validation middleware.
 */
interface ValidationOptions {
  required?: boolean;
  optional?: boolean;
  checkFalsy?: boolean;
  nullable?: boolean;
  msg?: string;
  alphaNumeric?: boolean;
  isIn?: string[];
  length?: { min?: number; max?: number };
  regex?: RegExp;
  email?: boolean;
  arrMin?: number;
}

/**
 * Creates a validator function with a specified default error message generator.
 */
const createValidationFactory = (
  defaultMessageFn: (field: string) => string
): ((
  source: typeof body | typeof param | typeof query,
  validationFn: (v: any, ...args: any[]) => any,
  field: string,
  options?: ValidationOptions,
  ...args: any[]
) => ValidationChain) => {
  /**
   * Creates express-validator middleware for a specific source, validation function, and field.
   */
  return (
    source: typeof body | typeof param | typeof query,
    validationFn: (v: any, ...args: any[]) => any,
    field: string,
    options: ValidationOptions = {},
    ...args: any[]
  ): ValidationChain => {
    let validator = validationFn(source(field), ...args);
    const message = options.msg || defaultMessageFn(field);

    if (options.required && !options.optional) {
      validator = validator.notEmpty().withMessage(`${field} is required`);
    } else if (options.optional) {
      validator = validator.optional({
        checkFalsy: options.checkFalsy ?? true,
        nullable: options.nullable ?? false,
      });
    }

    if (options.alphaNumeric) {
      validator = validator
        .isAlphanumeric()
        .withMessage(`${field} must be alphanumeric`);
    }

    if (options.isIn) {
      validator = validator
        .isIn(options.isIn)
        .withMessage(`${field} must be one of ${options.isIn.join(', ')}`);
    }

    if (options.length) {
      validator = validator
        .isLength(options.length)
        .withMessage(
          `${field} must be between ${options.length.min || 1} and ${options.length.max || 500} characters`
        );
    } else {
      validator = validator
        .isLength(DEFAULT_LENGTH)
        .withMessage(
          `${field} must be less than ${DEFAULT_LENGTH.max} characters`
        );
    }

    if (options.regex) {
      validator = validator
        .matches(options.regex)
        .withMessage(`${field} does not match the required pattern`);
    }

    if (options.email) {
      validator = validator
        .isEmail()
        .withMessage(`${field} must be a valid email`);
    }

    if (options.arrMin) {
      validator = validator
        .isArray({ min: options.arrMin })
        .withMessage(`${field} must have at least ${options.arrMin} items`);
    }

    return validator.withMessage(message);
  };
};

const defaultMessage = (field: string): string => `Invalid ${field}`;
const createValidator = createValidationFactory(defaultMessage);

const createStringValidator = (
  source: typeof body | typeof param | typeof query
) => {
  return (
    field: string,
    optional: boolean = false,
    options: ValidationOptions = {}
  ): ValidationChain =>
    createValidator(source, v => v.isString(), field, { ...options, optional });
};

const createUuidValidator = (
  source: typeof body | typeof param | typeof query
) => {
  return (
    field: string,
    optional: boolean = false,
    options: ValidationOptions = {}
  ): ValidationChain =>
    createValidator(source, v => v.isUUID(4), field, { ...options, optional });
};

const createEmailValidator = (
  source: typeof body | typeof param | typeof query
) => {
  return (
    field: string,
    optional: boolean = false,
    options: ValidationOptions = {}
  ): ValidationChain =>
    createValidator(source, v => v.isEmail(), field, {
      ...options,
      email: true,
      length: options.length || EMAIL_LENGTH,
      optional,
    });
};

const createRegexValidator = (
  source: typeof body | typeof param | typeof query
) => {
  return (
    field: string,
    optional: boolean = false,
    options: ValidationOptions = {}
  ): ValidationChain =>
    createValidator(source, v => v.matches(options.regex), field, {
      ...options,
      optional,
    });
};

const createBooleanValidator = (
  source: typeof body | typeof param | typeof query
) => {
  return (
    field: string,
    optional: boolean = false,
    options: ValidationOptions = {}
  ): ValidationChain =>
    createValidator(source, v => v.isBoolean(), field, {
      ...options,
      optional,
    });
};

const createIntValidator = (
  source: typeof body | typeof param | typeof query
) => {
  return (
    field: string,
    optional: boolean = false,
    options: ValidationOptions = {}
  ): ValidationChain =>
    createValidator(source, v => v.isInt(), field, { ...options, optional });
};

const createNumericValidator = (
  source: typeof body | typeof param | typeof query
) => {
  return (
    field: string,
    optional: boolean = false,
    options: ValidationOptions = {}
  ): ValidationChain =>
    createValidator(source, v => v.isNumeric(), field, {
      ...options,
      optional,
    });
};

const createArrayValidator = (
  source: typeof body | typeof param | typeof query
) => {
  return (
    field: string,
    optional: boolean = false,
    options: ValidationOptions = {}
  ): ValidationChain =>
    createValidator(source, v => v.isArray(), field, { ...options, optional });
};

const createObjectValidator = (
  source: typeof body | typeof param | typeof query
) => {
  return (
    field: string,
    optional: boolean = false,
    options: ValidationOptions = {}
  ): ValidationChain =>
    createValidator(
      source,
      v => v.isObject().withMessage(`${field} must be an object`),
      field,
      { ...options, optional }
    );
};

const createCronValidator = (
  source: typeof body | typeof param | typeof query
) => {
  return (
    field: string,
    optional: boolean = false,
    options: ValidationOptions = {}
  ): ValidationChain =>
    createValidator(
      source,
      v =>
        v.custom(value => {
          const valArray = value.split(' ');
          if (valArray.length > 5) {
            throw new Error(
              `Expected number of cron parts 5, received ${valArray.length}`
            );
          }
          return Promise.resolve('Good to go');
        }),
      field,
      { ...options, optional }
    );
};

const createUrlValidator = (
  source: typeof body | typeof param | typeof query
) => {
  return (
    field: string,
    optional: boolean = false,
    options: ValidationOptions = {}
  ): ValidationChain =>
    createValidator(source, v => v.isURL(), field, { ...options, optional });
};

const createDateValidator = (
  source: typeof body | typeof param | typeof query
) => {
  return (
    field: string,
    optional: boolean = false,
    options: ValidationOptions = {}
  ): ValidationChain =>
    createValidator(source, v => v.isDate(), field, {
      ...options,
      optional,
    });
};

const createDateTimeValidator = (
  source: typeof body | typeof param | typeof query
) => {
  return (
    field: string,
    optional: boolean = false,
    options: ValidationOptions = {}
  ): ValidationChain =>
    createValidator(source, v => v.isISO8601(), field, {
      ...options,
      optional,
    });
};

const createEnumValidator = (
  source: typeof body | typeof param | typeof query
) => {
  return (
    field: string,
    optional: boolean = false,
    enumValues: string[],
    options: ValidationOptions = {}
  ): ValidationChain =>
    createValidator(source, v => v.isIn(enumValues), field, {
      ...options,
      optional,
    });
};

// Source-specific validators
const stringBody = createStringValidator(body);
const stringQuery = createStringValidator(query);
const stringParam = createStringValidator(param);
const uuidBody = createUuidValidator(body);
const uuidParam = createUuidValidator(param);
const uuidQuery = createUuidValidator(query);
const emailBody = createEmailValidator(body);
const regexBody = createRegexValidator(body);
const regexQuery = createRegexValidator(query);
const regexParam = createRegexValidator(param);
const booleanBody = createBooleanValidator(body);
const booleanQuery = createBooleanValidator(query);
const booleanParam = createBooleanValidator(param);
const intBody = createIntValidator(body);
const intQuery = createIntValidator(query);
const intParam = createIntValidator(param);
const numericBody = createNumericValidator(body);
const arrayBody = createArrayValidator(body);
const arrayQuery = createArrayValidator(query);
const arrayParam = createArrayValidator(param);
const objectBody = createObjectValidator(body);
const objectQuery = createObjectValidator(query);
const objectParam = createObjectValidator(param);
const cronBody = createCronValidator(body);
const cronQuery = createCronValidator(query);
const cronParam = createCronValidator(param);
const urlBody = createUrlValidator(body);
const urlQuery = createUrlValidator(query);
const urlParam = createUrlValidator(param);
const dateBody = createDateValidator(body);
const dateParam = createDateValidator(param);
const dateQuery = createDateValidator(query);
const dateTimeBody = createDateTimeValidator(body);
const dateTimeParam = createDateTimeValidator(param);
const dateTimeQuery = createDateTimeValidator(query);
const enumBody = createEnumValidator(body);

const queryUuids = {
  id: uuidQuery('id'),
  clusterId: uuidQuery('clusterId'),
  clusterid: uuidQuery('clusterid'),
  cluster_id: uuidQuery('cluster_id'),
  applicationId: uuidQuery('applicationId'),
  application_id: uuidQuery('application_id'),
  app_id: uuidQuery('app_id'),
  appId: uuidQuery('appId'),
  job_id: uuidQuery('job_id'),
  jobId: uuidQuery('jobId'),
  dataFlowId: uuidQuery('dataFlowId'),
};

const bodyUuids = {
  id: uuidBody('id'),
  clusterId: uuidBody('clusterId'),
  clusterid: uuidBody('clusterid'),
  cluster_id: uuidBody('cluster_id'),
  applicationId: uuidBody('applicationId'),
  application_id: uuidBody('application_id'),
  app_id: uuidBody('app_id'),
  appId: uuidBody('appId'),
  job_id: uuidBody('job_id'),
  jobId: uuidBody('jobId'),
  dataFlowId: uuidBody('dataFlowId'),
  createdBy: uuidBody('createdBy'),
  lastUpdatedBy: uuidBody('lastUpdatedBy'),
  arrayIds: [arrayBody('ids', false, { arrMin: 1 }), uuidBody('ids.*')],
};

const paramUuids = {
  id: uuidParam('id'),
  clusterId: uuidParam('clusterId'),
  clusterid: uuidParam('clusterid'),
  cluster_id: uuidParam('cluster_id'),
  applicationId: uuidParam('applicationId'),
  application_id: uuidParam('application_id'),
  app_id: uuidParam('app_id'),
  appId: uuidParam('appId'),
  job_id: uuidParam('job_id'),
  jobId: uuidParam('jobId'),
  dataFlowId: uuidParam('dataFlowId'),
};

export {
  stringBody,
  stringQuery,
  stringParam,
  uuidBody,
  uuidParam,
  uuidQuery,
  emailBody,
  regexBody,
  regexQuery,
  regexParam,
  booleanBody,
  booleanQuery,
  booleanParam,
  intBody,
  intQuery,
  intParam,
  arrayBody,
  arrayQuery,
  arrayParam,
  objectBody,
  objectQuery,
  objectParam,
  cronBody,
  cronQuery,
  cronParam,
  urlBody,
  urlQuery,
  urlParam,
  NAME_LENGTH,
  DESCRIPTION_LENGTH,
  MONITORING_NAME_LENGTH,
  COMMENT_LENGTH,
  EMAIL_LENGTH,
  PASSWORD_LENGTH,
  TITLE_REGEX,
  numericBody,
  queryUuids,
  bodyUuids,
  paramUuids,
  dateBody,
  dateQuery,
  dateParam,
  dateTimeBody,
  dateTimeQuery,
  dateTimeParam,
  enumBody,
  APPROVAL_STATUSES,
};
