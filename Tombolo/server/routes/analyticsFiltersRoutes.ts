import express from 'express';
import {
  getAnalyticsFilters,
  getAnalyticsFilterById,
  createAnalyticsFilter,
  updateAnalyticsFilter,
  deleteAnalyticsFilter,
} from '../controllers/analyticsFiltersController.js';
import {
  validateGetAnalyticsFilters,
  validateGetAnalyticsFilterById,
  validateCreateAnalyticsFilter,
  validateUpdateAnalyticsFilter,
  validateDeleteAnalyticsFilter,
} from '../middlewares/analyticsFiltersMiddleware.js';
import { validate } from '../middlewares/validateRequestBody.js';
import { validateUserRole } from '../middlewares/rbacMiddleware.js';
import role from '../config/roleTypes.js';

const router = express.Router();

// All routes below require authenticated user (OWNER or ADMIN role)
router.use(validateUserRole([role.OWNER, role.ADMIN]));

/**
 * @route   GET /api/analyticsFilters
 * @desc    Get all analytics filters for the authenticated user
 * @access  Private
 */
router.get('/', validate(validateGetAnalyticsFilters), getAnalyticsFilters);

/**
 * @route   GET /api/analyticsFilters/:id
 * @desc    Get a single analytics filter by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(validateGetAnalyticsFilterById),
  getAnalyticsFilterById
);

/**
 * @route   POST /api/analyticsFilters
 * @desc    Create a new analytics filter
 * @access  Private
 * @body    { name: string, conditions: string, description?: string }
 */
router.post(
  '/',
  validate(validateCreateAnalyticsFilter),
  createAnalyticsFilter
);

/**
 * @route   PATCH /api/analyticsFilters/:id
 * @desc    Update an analytics filter
 * @access  Private
 * @body    { name?: string, conditions?: string, description?: string }
 */
router.patch(
  '/:id',
  validate(validateUpdateAnalyticsFilter),
  updateAnalyticsFilter
);

/**
 * @route   DELETE /api/analyticsFilters/:id
 * @desc    Delete an analytics filter (soft delete)
 * @access  Private
 */
router.delete(
  '/:id',
  validate(validateDeleteAnalyticsFilter),
  deleteAnalyticsFilter
);

export default router;
