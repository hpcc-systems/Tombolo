import express from 'express';
import {
  executeAnalyticsQuery,
  getSchema,
  analyzeQuery,
  getDatabaseStats,
} from '../controllers/workunitAnalyticsController.js';
import {
  validateAnalyticsQuery,
  validateAnalyzeQuery,
  validateGetSchema,
  validateGetDatabaseStats,
} from '../middlewares/workunitAnalyticsMiddleware.js';
import { validate } from '../middlewares/validateRequestBody.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * @route   POST /api/workunitAnalytics/query
 * @desc    Execute a read-only SQL query against work_unit_details
 * @access  Private
 * @body    { sql: string, options?: { limit?: number, clusterId?: string } }
 */
router.post(
  '/query',
  (req, res, next) => {
    logger.debug('=== POST /workunitAnalytics/query ===');
    logger.debug('Request body:', JSON.stringify(req.body, null, 2));
    next();
  },
  validate(validateAnalyticsQuery),
  executeAnalyticsQuery
);

/**
 * @route   GET /api/workunitAnalytics/schema
 * @desc    Get database schema for work_unit_details table
 * @access  Private
 * @query   { tableName?: string }
 */
router.get('/schema', validate(validateGetSchema), getSchema);

/**
 * @route   POST /api/workunitAnalytics/analyze
 * @desc    Analyze query execution plan without running it
 * @access  Private
 * @body    { sql: string }
 */
router.post('/analyze', validate(validateAnalyzeQuery), analyzeQuery);

/**
 * @route   GET /api/workunitAnalytics/stats
 * @desc    Get database statistics (record counts, size, etc.)
 * @access  Private
 * @query   { includeDistributions?: boolean, startDate?: string, endDate?: string }
 */
router.get('/stats', validate(validateGetDatabaseStats), getDatabaseStats);

export default router;
