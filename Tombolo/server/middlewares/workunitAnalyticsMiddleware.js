import { body } from 'express-validator';
import {
  stringBody,
  stringQuery,
  intBody,
  booleanQuery,
  dateTimeQuery,
  objectBody,
  arrayBody,
} from './commonMiddleware.js';
import { forbiddenSqlKeywords } from '@tombolo/shared';
import logger from '../config/logger.js';

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
    .customSanitizer(value => {
      // Strip comments and normalize whitespace
      const cleaned = value
        .replace(/--[^\n]*/g, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
        .trim();

      logger.debug('SQL after sanitization:', JSON.stringify(cleaned));
      return cleaned;
    })
    .custom(value => {
      // At this point value has comments stripped and whitespace normalized
      logger.debug('Checking if SELECT, value:', JSON.stringify(value));

      // Check if starts with SELECT (case-insensitive)
      if (!value.toLowerCase().startsWith('select')) {
        throw new Error('Only SELECT statements are allowed');
      }
      return true;
    })
    .bail()
    .custom(value => {
      // Check for semicolons (multiple statements)
      if (value.includes(';')) {
        throw new Error('Multiple statements are not allowed');
      }
      return true;
    })
    .bail()
    .custom(value => {
      // Strip comments and check for forbidden keywords
      const withoutComments = value
        .replace(/--[^\n]*/g, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .trim();

      const lowerQuery = withoutComments.toLowerCase();

      for (const keyword of forbiddenSqlKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(lowerQuery)) {
          throw new Error(
            `Keyword '${keyword}' is not allowed. Only non-destructive SELECT queries permitted.`
          );
        }
      }
      return true;
    })
    .bail()
    .custom(value => {
      // Check for UNIONs (still not allowed)
      const lowerQuery = value.toLowerCase();
      if (/\bunion\b/i.test(lowerQuery)) {
        throw new Error('UNIONs are not allowed in this interface');
      }
      return true;
    })
    .bail()
    .custom(value => {
      // Check for sensitive columns from clusters table
      const sensitiveColumns = [
        'username',
        'hash',
        'password',
        'password_hash',
      ];
      const lowerQuery = value.toLowerCase();

      // Check if query references clusters table
      if (/\b(?:from|join)\s+clusters\b/i.test(lowerQuery)) {
        // Check for sensitive columns being selected
        for (const col of sensitiveColumns) {
          const patterns = [
            new RegExp(`\\bclusters?\\.${col}\\b`, 'i'), // clusters.username
            new RegExp(`\\bc\\.${col}\\b`, 'i'), // c.username (common alias)
            new RegExp(`select\\s+.*\\b${col}\\b.*from\\s+clusters`, 'i'), // direct column name
          ];

          for (const pattern of patterns) {
            if (pattern.test(lowerQuery)) {
              throw new Error(
                `Column '${col}' from clusters table is not allowed for security reasons`
              );
            }
          }
        }
      }
      return true;
    })
    .bail()
    .custom(value => {
      // Validate that only allowed tables are referenced
      const allowedTables = ['work_unit_details', 'work_units', 'clusters'];

      // Extract table names from FROM and JOIN clauses
      const tablePattern = /\b(?:from|join)\s+(\w+)/gi;
      const tables = [];
      let match;

      while ((match = tablePattern.exec(value)) !== null) {
        tables.push(match[1].toLowerCase());
      }

      const invalidTables = tables.filter(
        table => !allowedTables.includes(table)
      );

      if (invalidTables.length > 0) {
        throw new Error(
          `Invalid table(s): ${invalidTables.join(', ')}. Only the following tables are allowed: ${allowedTables.join(', ')}`
        );
      }

      if (tables.length === 0) {
        throw new Error(
          'Query must include a FROM clause with an allowed table'
        );
      }

      return true;
    }),

  objectBody('options', true),
  intBody('options.limit', true, { min: 1, max: 5000 }),
  stringBody('options.clusterId', true),
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
      // Basic validation - must be SELECT statement
      const trimmed = value.trim();
      if (!trimmed.toLowerCase().startsWith('select')) {
        throw new Error('Only SELECT statements can be analyzed');
      }
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
  intBody('page', true, { min: 1 }),
  intBody('limit', true, { min: 1, max: 100 }),
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
    const withoutComments = value
      .replace(/--[^\n]*/g, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .trim();

    if (!withoutComments.toLowerCase().startsWith('select')) {
      throw new Error('Only SELECT statements are allowed');
    }
    return true;
  },

  noMultipleStatements: value => {
    if (value.includes(';')) {
      throw new Error('Multiple statements are not allowed');
    }
    return true;
  },

  noForbiddenKeywords: value => {
    const withoutComments = value
      .replace(/--[^\n]*/g, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .trim();

    const lowerQuery = withoutComments.toLowerCase();

    for (const keyword of forbiddenSqlKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowerQuery)) {
        throw new Error(
          `Keyword '${keyword}' is not allowed. Only non-destructive SELECT queries permitted.`
        );
      }
    }
    return true;
  },

  noUnions: value => {
    if (/\bunion\b/i.test(value)) {
      throw new Error('UNIONs are not allowed in this interface');
    }
    return true;
  },

  onlyAllowedTables: value => {
    const allowedTables = ['work_unit_details', 'work_units', 'clusters'];
    const tablePattern = /\b(?:from|join)\s+(\w+)/gi;
    const tables = [];
    let match;

    while ((match = tablePattern.exec(value)) !== null) {
      tables.push(match[1].toLowerCase());
    }

    const invalidTables = tables.filter(
      table => !allowedTables.includes(table)
    );

    if (invalidTables.length > 0) {
      throw new Error(
        `Invalid table(s): ${invalidTables.join(', ')}. Only the following tables are allowed: ${allowedTables.join(', ')}`
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
