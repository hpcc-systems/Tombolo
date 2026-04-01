import { body, param } from 'express-validator';

/**
 * Validation for GET /api/analyticsFilters
 */
export const validateGetAnalyticsFilters = [];

/**
 * Validation for GET /api/analyticsFilters/:id
 */
export const validateGetAnalyticsFilterById = [
  param('id').isUUID().withMessage('Filter ID must be a valid UUID'),
];

/**
 * Validation for POST /api/analyticsFilters
 */
export const validateCreateAnalyticsFilter = [
  body('name')
    .isString()
    .withMessage('name must be a string')
    .bail()
    .notEmpty()
    .withMessage('name is required')
    .bail()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('name must be between 1 and 30 characters'),

  body('conditions')
    .isString()
    .withMessage('conditions must be a string')
    .bail()
    .notEmpty()
    .withMessage('conditions is required')
    .bail()
    .trim(),

  body('description')
    .optional()
    .isString()
    .withMessage('description must be a string')
    .bail()
    .trim()
    .isLength({ max: 255 })
    .withMessage('description must not exceed 255 characters'),

  body('applicationId')
    .optional()
    .isUUID()
    .withMessage('applicationId must be a valid UUID'),
];

/**
 * Validation for PATCH /api/analyticsFilters/:id
 */
export const validateUpdateAnalyticsFilter = [
  param('id').isUUID().withMessage('Filter ID must be a valid UUID'),

  body('name')
    .optional()
    .isString()
    .withMessage('name must be a string')
    .bail()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('name must be between 1 and 30 characters'),

  body('conditions')
    .optional()
    .isString()
    .withMessage('conditions must be a string')
    .bail()
    .trim(),

  body('description')
    .optional()
    .isString()
    .withMessage('description must be a string')
    .bail()
    .trim()
    .isLength({ max: 255 })
    .withMessage('description must not exceed 255 characters'),

  body('applicationId')
    .optional()
    .isUUID()
    .withMessage('applicationId must be a valid UUID'),
];

/**
 * Validation for DELETE /api/analyticsFilters/:id
 */
export const validateDeleteAnalyticsFilter = [
  param('id').isUUID().withMessage('Filter ID must be a valid UUID'),
];
