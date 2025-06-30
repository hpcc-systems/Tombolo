const { query, body, param, validationResult } = require('express-validator');

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
  body('createdBy')
    .isUUID()
    .withMessage('Created by must be a valid user UUID'),
  body('lastUpdatedBy')
    .isUUID()
    .withMessage('Last updated by must be a valid user UUID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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
      return res.status(400).json({
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
};
