import { body, query } from 'express-validator';
import {
  stringBody,
  intBody,
  booleanQuery,
  dateTimeQuery,
  objectBody,
} from './commonMiddleware.js';
import logger from '../config/logger.js';
import {
  ALLOWED_WORKUNIT_ANALYTICS_TABLES,
  ALLOWED_WORKUNIT_ANALYTICS_TABLE_SET,
  SCOPEABLE_WORKUNIT_ANALYTICS_TABLES,
  SCOPEABLE_WORKUNIT_ANALYTICS_TABLE_SET,
  SENSITIVE_WORKUNIT_ANALYTICS_CLUSTER_COLUMNS,
  WORKUNIT_ANALYTICS_SCOPE_VALUE_REGEX,
} from '../config/workunitAnalyticsPolicy.js';
import {
  collectReferencedTables,
  findSensitiveClusterColumnViolation,
  parseAndValidateAnalyticsSql,
} from '../utils/workunitAnalyticsSqlAst.js';

// Validation for POST /api/analytics/query
const validateAnalyticsQuery = [
  body('sql')
    .isString()
    .withMessage('sql must be a string')
    .bail()
    .notEmpty()
    .withMessage('sql is required')
    .bail()
    .trim()
    .custom((value, { req }) => {
      const parsed = parseAndValidateAnalyticsSql(value);
      const tables = collectReferencedTables(parsed.ast);
      const invalidTables = tables.filter(
        table => !ALLOWED_WORKUNIT_ANALYTICS_TABLE_SET.has(table)
      );

      if (invalidTables.length > 0) {
        throw new Error(
          `Invalid table(s): ${invalidTables.join(', ')}. Only the following tables are allowed: ${ALLOWED_WORKUNIT_ANALYTICS_TABLES.join(', ')}`
        );
      }

      if (tables.length === 0) {
        throw new Error(
          'Query must include a FROM clause with an allowed table'
        );
      }

      const sensitiveColumnViolation = findSensitiveClusterColumnViolation(
        parsed.ast,
        SENSITIVE_WORKUNIT_ANALYTICS_CLUSTER_COLUMNS
      );

      if (sensitiveColumnViolation) {
        if (sensitiveColumnViolation === '*') {
          throw new Error(
            'Selecting wildcard columns from clusters table is not allowed for security reasons'
          );
        }

        throw new Error(
          `Column '${sensitiveColumnViolation}' from clusters table is not allowed for security reasons`
        );
      }

      req.analyticsSqlContext = parsed;
      logger.debug('Analytics SQL validated using AST', {
        normalizedSql: parsed.normalizedSql,
        hadTrailingSemicolon: parsed.hadTrailingSemicolon,
        tableCount: tables.length,
      });

      return true;
    }),

  objectBody('options', true),
  intBody('options.limit', true),
  stringBody('options.clusterId', true),
  // Optional scoping fields used by executeAnalyticsQuery — validate strictly
  body('options.scopeToWuid')
    .optional()
    .isString()
    .withMessage('scopeToWuid must be a string')
    .bail()
    .trim()
    .isLength({ min: 1, max: 128 })
    .withMessage('scopeToWuid must be 1-128 characters')
    .matches(WORKUNIT_ANALYTICS_SCOPE_VALUE_REGEX)
    .withMessage(
      'scopeToWuid may only contain letters, numbers, dot, underscore, colon, and hyphen'
    ),

  body('options.scopeToClusterId')
    .optional()
    .isString()
    .withMessage('scopeToClusterId must be a string')
    .bail()
    .trim()
    .isLength({ min: 1, max: 128 })
    .withMessage('scopeToClusterId must be 1-128 characters')
    .matches(WORKUNIT_ANALYTICS_SCOPE_VALUE_REGEX)
    .withMessage(
      'scopeToClusterId may only contain letters, numbers, dot, underscore, colon, and hyphen'
    ),
];

// Validation for GET /api/analytics/schema
const validateGetSchema = [
  query('tableName')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('tableName must be a string')
    .isLength({ max: 200 })
    .withMessage('tableName must be less than 200 characters')
    .isIn([...ALLOWED_WORKUNIT_ANALYTICS_TABLES])
    .withMessage(
      `Only ${ALLOWED_WORKUNIT_ANALYTICS_TABLES.join(', ')} tables are available`
    ),
];

// Validation for POST /api/workunitAnalytics/scoped/query
const validateScopedAnalyticsQuery = [
  ...validateAnalyticsQuery,

  body('options')
    .exists()
    .withMessage('options is required for scoped queries')
    .bail()
    .isObject()
    .withMessage('options must be an object'),

  body('options.scopeToWuid')
    .exists({ values: 'falsy' })
    .withMessage('scopeToWuid is required for scoped queries'),

  body('options.scopeToClusterId')
    .exists({ values: 'falsy' })
    .withMessage('scopeToClusterId is required for scoped queries'),

  body('sql').custom((value, { req }) => {
    const parsed =
      req.analyticsSqlContext ||
      parseAndValidateAnalyticsSql(typeof value === 'string' ? value : '');

    const tables = collectReferencedTables(parsed.ast);
    const invalidTables = tables.filter(
      table => !SCOPEABLE_WORKUNIT_ANALYTICS_TABLE_SET.has(table)
    );

    if (invalidTables.length > 0) {
      throw new Error(
        `Invalid table(s) for scoped query: ${invalidTables.join(', ')}. Scoped queries only allow: ${SCOPEABLE_WORKUNIT_ANALYTICS_TABLES.join(', ')}`
      );
    }

    logger.debug('Scoped analytics SQL validated', {
      normalizedSql: parsed.normalizedSql,
      tableCount: tables.length,
      tables,
    });

    return true;
  }),
];

// Validation for GET /api/workunitAnalytics/scoped/schema
const validateGetScopedSchema = [
  ...validateGetSchema,
  query('tableName')
    .optional({ values: 'falsy' })
    .isIn([...SCOPEABLE_WORKUNIT_ANALYTICS_TABLES])
    .withMessage(
      `Only ${SCOPEABLE_WORKUNIT_ANALYTICS_TABLES.join(', ')} tables are available on the scoped schema endpoint`
    ),
];

// Validation for GET /api/analytics/stats
const validateGetDatabaseStats = [
  booleanQuery('includeDistributions', true),
  dateTimeQuery('startDate', true),
  dateTimeQuery('endDate', true),
];

export {
  validateAnalyticsQuery,
  validateGetSchema,
  validateGetDatabaseStats,
  validateScopedAnalyticsQuery,
  validateGetScopedSchema,
};
