const { query, body, param, validationResult } = require('express-validator');
const logger = require('../config/logger');

// Validate cluster id from the query parameters
const validateClusterId = [
  query('clusterId').isUUID(4).withMessage('Invalid cluster id'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }
    next();
  },
];

// Vlaidate req.body.ids array of UUIDs
const validateIds = [
  body('ids').isArray({ min: 1 }).withMessage('IDs must be a non-empty array'),
  body('ids.*').isUUID().withMessage('Each ID must be a valid UUID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }
    next();
  },
];

const validateFileListParams = [
  query('clusterId').isUUID(4).withMessage('Invalid cluster id'),
  query('DropZoneName').isString().withMessage('Invalid dropzone name'),
  query('Netaddr')
    .isString()

    .withMessage('Netaddr must be string'),
  query('Path').isString().withMessage('Invalid path'),
  query('DirectoryOnly')
    .isBoolean()
    .withMessage('Invalid  directory only flag'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorString = errors
        .array()
        .map(e => e.msg)
        .join(', ');
      logger.error(`Get file list.Validation failed: ${errorString}`);
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }
    next();
  },
];

// Validate landing zone monitoring creation payload
const validateCreateLandingZoneMonitoring = [
  body('applicationId')
    .isUUID()
    .withMessage('Application ID must be a valid UUID'),
  body('monitoringName')
    .notEmpty()
    .withMessage('Monitoring name is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Monitoring name must be between 3 and 255 characters'),
  body('lzMonitoringType')
    .isIn(['fileCount', 'spaceUsage', 'fileMovement'])
    .withMessage(
      'Landing zone monitoring type must be one of: fileCount, spaceUsage, fileMovement'
    ),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('clusterId').isUUID().withMessage('Cluster ID must be a valid UUID'),
  body('metaData').isObject().withMessage('Meta data must be an object'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorString = errors
        .array()
        .map(e => e.msg)
        .join(', ');
      logger.error(
        `Create LZ monitoring.Validation failed ...: ${errorString}`
      );
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: JSON.stringify(errors.array()),
      });
    }
    next();
  },
];

// Validate application ID parameter for getting all landing zone monitorings
const validateApplicationId = [
  param('applicationId')
    .isUUID()
    .withMessage('Application ID must be a valid UUID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorString = errors
        .array()
        .map(e => e.msg)
        .join(', ');
      logger.error(`Get LZ monitoring.Validation failed: ${errorString}`);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: JSON.stringify(errors.array()),
      });
    }
    next();
  },
];

// Validate ID parameter for getting single landing zone monitoring
const validateId = [
  param('id').isUUID().withMessage('ID must be a valid UUID'),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorString = errors
        .array()
        .map(e => e.msg)
        .join(', ');
      logger.error(`Get LZ monitoring.Validation failed: ${errorString}`);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: JSON.stringify(errors.array()),
      });
    }
    next();
  },
];

// Validate landing zone monitoring update payload
const validateUpdateLandingZoneMonitoring = [
  body('id').isUUID().withMessage('ID must be a valid UUID'),
  body('applicationId')
    .optional()
    .isUUID()
    .withMessage('Application ID must be a valid UUID'),
  body('monitoringName')
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage('Monitoring name must be between 3 and 255 characters'),
  body('lzMonitoringType')
    .optional()
    .isIn(['fileCount', 'spaceUsage', 'fileMovement'])
    .withMessage(
      'Landing zone monitoring type must be one of: fileCount, spaceUsage, fileMovement'
    ),
  body('description')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('clusterId')
    .optional()
    .isUUID()
    .withMessage('Cluster ID must be a valid UUID'),
  body('metaData')
    .optional()
    .isObject()
    .withMessage('Meta data must be an object'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  body('lastUpdatedBy')
    .isUUID()
    .withMessage('Last updated by must be a valid user UUID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorString = errors
        .array()
        .map(e => e.msg)
        .join(', ');
      logger.error(`Update LZ monitoring.Validation failed: ${errorString}`);
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: JSON.stringify(errors.array()),
      });
    }
    next();
  },
];

// Validate toggle status request
const validateToggleStatus = [
  body('ids').isArray({ min: 1 }).withMessage('IDs must be a non-empty array'),
  body('ids.*').isUUID().withMessage('Each ID must be a valid UUID'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean value'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorString = errors
        .array()
        .map(e => e.msg)
        .join(', ');
      logger.error(`Toggle status.Validation failed: ${errorString}`);
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: JSON.stringify(errors.array()),
      });
    }
    next();
  },
];

// Validate evaluate request (approve/reject)
const validateEvaluateLandingZoneMonitoring = [
  body('ids').isArray({ min: 1 }).withMessage('IDs must be a non-empty array'),
  body('ids.*').isUUID().withMessage('Each ID must be a valid UUID'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  body('approvalStatus')
    .isIn(['approved', 'rejected', 'pending'])
    .withMessage(
      'Approval status must be either approved, rejected or pending'
    ),
  body('approverComment')
    .notEmpty()
    .isString()
    .withMessage('Approver comment must be a non-empty string')
    .isLength({ min: 4, max: 200 })
    .withMessage('Approver comment must be between 4 and 200 characters long'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorString = errors
        .array()
        .map(e => e.msg)
        .join(', ');
      logger.error(`Evaluate LZ monitoring.Validation failed: ${errorString}`);
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: JSON.stringify(errors.array()),
      });
    }
    next();
  },
];

// Validate bulk update payload
const validateBulkUpdatePayload = [
  body('metaData').isArray().withMessage('Meta data must be an array'),
  body('metaData.*')
    .isObject()
    .withMessage('Each item in meta data must be an object'),
  body('metaData.*.id').isUUID().withMessage('ID must be a valid UUID'),
  // body('metaData.contacts')
  //   .isObject()
  //   .withMessage('Contacts must be an object'),
  // body('metaData.contacts.*')
  //   .isArray()
  //   .withMessage('Each contact must be an array'),
  // body('metaData.contacts.*.*')
  //   .isEmail()
  //   .withMessage('Each email must be a valid email address'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorString = errors
        .array()
        .map(e => e.msg)
        .join(', ');
      logger.error(`Bulk update.Validation failed: ${errorString}`);
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: JSON.stringify(errors.array()),
      });
    }
    next();
  },
];

//Exports
module.exports = {
  validateClusterId,
  validateFileListParams,
  validateCreateLandingZoneMonitoring,
  validateApplicationId,
  validateId,
  validateIds,
  validateUpdateLandingZoneMonitoring,
  validateToggleStatus,
  validateEvaluateLandingZoneMonitoring,
  validateBulkUpdatePayload,
};
