import express from 'express';
import {
  executeAnalyticsQuery,
  getSchema,
  getDatabaseStats,
} from '../controllers/workunitAnalyticsController.js';
import {
  validateAnalyticsQuery,
  validateGetSchema,
  validateGetDatabaseStats,
} from '../middlewares/workunitAnalyticsMiddleware.js';
import {
  validate,
  validateWithFirstErrorMessage,
} from '../middlewares/validateRequestBody.js';
import { validateUserRole } from '../middlewares/rbacMiddleware.js';
import role from '../config/roleTypes.js';
import logger from '../config/logger.js';

const router = express.Router();

// All routes below require OWNER or ADMIN role
router.use(validateUserRole([role.OWNER, role.ADMIN]));

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
  validateWithFirstErrorMessage(validateAnalyticsQuery),
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
 * @route   GET /api/workunitAnalytics/stats
 * @desc    Get database statistics (record counts, size, etc.)
 * @access  Private
 * @query   { includeDistributions?: boolean, startDate?: string, endDate?: string }
 */
router.get('/stats', validate(validateGetDatabaseStats), getDatabaseStats);

export default router;
