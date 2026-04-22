import { body } from 'express-validator';
import {
  stringBody,
  stringQuery,
  intBody,
  intQuery,
  booleanQuery,
  dateTimeQuery,
  objectBody,
  arrayBody,
} from './commonMiddleware.js';
import logger from '../config/logger.js';
import {
  collectReferencedTables,
  findSensitiveClusterColumnViolation,
  parseAndValidateAnalyticsSql,
} from '../utils/workunitAnalyticsSqlAst.js';

// Valid sort fields for analytics queries (if we add sorting to results)
const VALID_ANALYTICS_SORT_FIELDS = [
  'wuId',
  'clusterId',
  'jobName',
  'state',
  'owner',
  'workUnitTimestamp',
  'totalCostms',
  'compileCostms',
  'executeCostms',
];

const ALLOWED_ANALYTICS_TABLES = [
  'work_unit_details',
  'work_units',
  'clusters',
];
const ALLOWED_ANALYTICS_TABLE_SET = new Set(ALLOWED_ANALYTICS_TABLES);
const SENSITIVE_CLUSTER_COLUMNS = [
  'username',
  'hash',
  'password',
  'password_hash',
];

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
        table => !ALLOWED_ANALYTICS_TABLE_SET.has(table)
      );

      if (invalidTables.length > 0) {
        throw new Error(
          `Invalid table(s): ${invalidTables.join(', ')}. Only the following tables are allowed: ${ALLOWED_ANALYTICS_TABLES.join(', ')}`
        );
      }

      if (tables.length === 0) {
        throw new Error(
          'Query must include a FROM clause with an allowed table'
        );
      }

      const sensitiveColumnViolation = findSensitiveClusterColumnViolation(
        parsed.ast,
        SENSITIVE_CLUSTER_COLUMNS
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
    .matches(/^[A-Za-z0-9_.:-]+$/)
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
    .matches(/^[A-Za-z0-9_.:-]+$/)
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
    isIn: ['work_unit_details', 'work_units', 'clusters'],
    msg: 'Only work_unit_details, work_units, and clusters tables are available',
  }),
];

// Validation for GET /api/analytics/stats
const validateGetDatabaseStats = [
  booleanQuery('includeDistributions', true),
  dateTimeQuery('startDate', true),
  dateTimeQuery('endDate', true),
];

// Validation for saved queries endpoints (if you add backend storage for queries)
const validateSaveQuery = [
  stringBody('name', false, { length: { min: 1, max: 255 } }),
  stringBody('sql', false),
  stringBody('description', true, { length: { max: 1000 } }),
  arrayBody('tags', true),
  body('tags.*')
    .optional()
    .isString()
    .withMessage('each tag must be a string')
    .trim()
    .isLength({ max: 50 })
    .withMessage('each tag must be less than 50 characters'),
  booleanQuery('isPublic', true),
];

// Validation for updating saved query
const validateUpdateQuery = [
  stringBody('name', true, { length: { min: 1, max: 255 } }),
  stringBody('sql', true),
  stringBody('description', true, { length: { max: 1000 } }),
  arrayBody('tags', true),
  booleanQuery('isPublic', true),
  booleanQuery('favorite', true),
];

// Validation for getting saved queries
const validateGetSavedQueries = [
  booleanQuery('includePublic', true),
  stringQuery('tag', true),
  stringQuery('search', true, { length: { max: 255 } }),
  intQuery('page', true),
  intQuery('limit', true),
];

// Validation for query export
const validateExportQuery = [
  stringBody('sql', false),
  stringBody('format', true, {
    isIn: ['csv', 'json', 'xlsx'],
    msg: 'format must be one of: csv, json, xlsx',
  }),
  body('filename')
    .optional()
    .isString()
    .withMessage('filename must be a string')
    .trim()
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      'filename can only contain letters, numbers, underscores, and hyphens'
    ),
];

// Helper function to validate SQL query structure (can be reused)
const sqlValidationRules = {
  isSelect: value => {
    parseAndValidateAnalyticsSql(value);
    return true;
  },

  noMultipleStatements: value => {
    parseAndValidateAnalyticsSql(value);
    return true;
  },

  noForbiddenKeywords: value => {
    parseAndValidateAnalyticsSql(value);
    return true;
  },

  noUnions: _value => {
    // UNION is allowed for read-only SELECT statements.
    return true;
  },

  onlyAllowedTables: value => {
    const parsed = parseAndValidateAnalyticsSql(value);
    const tables = collectReferencedTables(parsed.ast);
    const invalidTables = tables.filter(
      table => !ALLOWED_ANALYTICS_TABLE_SET.has(table)
    );

    if (invalidTables.length > 0) {
      throw new Error(
        `Invalid table(s): ${invalidTables.join(', ')}. Only the following tables are allowed: ${ALLOWED_ANALYTICS_TABLES.join(', ')}`
      );
    }

    if (tables.length === 0) {
      throw new Error('Query must include a FROM clause with an allowed table');
    }

    return true;
  },
};

export {
  validateAnalyticsQuery,
  validateAnalyzeQuery,
  validateGetSchema,
  validateGetDatabaseStats,
  validateSaveQuery,
  validateUpdateQuery,
  validateGetSavedQueries,
  validateExportQuery,
  VALID_ANALYTICS_SORT_FIELDS,
  sqlValidationRules,
};
