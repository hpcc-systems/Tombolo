import { body } from 'express-validator';
import {
  stringBody,
  stringQuery,
  intBody,
  booleanQuery,
  dateTimeQuery,
  objectBody,
} from './commonMiddleware.js';
import logger from '../config/logger.js';
import {
  ALLOWED_WORKUNIT_ANALYTICS_TABLES,
  ALLOWED_WORKUNIT_ANALYTICS_TABLE_SET,
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

// Validation for POST /api/analytics/analyze
const validateAnalyzeQuery = [
  body('sql')
    .isString()
    .withMessage('sql must be a string')
    .bail()
    .notEmpty()
    .withMessage('sql is required')
    .bail()
    .trim()
    .custom(value => {
      parseAndValidateAnalyticsSql(value);
      return true;
    }),
];

// Validation for GET /api/analytics/schema
const validateGetSchema = [
  stringQuery('tableName', true, {
    isIn: [...ALLOWED_WORKUNIT_ANALYTICS_TABLES],
    msg: 'Only work_unit_details, work_units, and clusters tables are available',
  }),
];

// Validation for GET /api/analytics/stats
const validateGetDatabaseStats = [
  booleanQuery('includeDistributions', true),
  dateTimeQuery('startDate', true),
  dateTimeQuery('endDate', true),
];

export {
  validateAnalyticsQuery,
  validateAnalyzeQuery,
  validateGetSchema,
  validateGetDatabaseStats,
};
