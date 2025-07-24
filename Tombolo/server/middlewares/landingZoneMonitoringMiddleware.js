const {
  DESCRIPTION_LENGTH,
  MONITORING_NAME_LENGTH,
  COMMENT_LENGTH,
  uuidQuery,
  arrayBody,
  uuidBody,
  stringQuery,
  stringBody,
  booleanQuery,
  objectBody,
  uuidParam,
  booleanBody,
} = require('./commonMiddleware');

// Validate cluster id from the query parameters
const validateClusterId = [uuidQuery('clusterId')];

// Validate req.body.ids array of UUIDs
const validateIds = [arrayBody('ids', false, { arrMin: 1 }), uuidBody('ids.*')];

const validateFileListParams = [
  uuidQuery('clusterId'),
  stringQuery('DropZoneName'),
  stringQuery('Netaddr'),
  stringQuery('Path'),
  booleanQuery('DirectoryOnly'),
];

// Validate landing zone monitoring creation payload
const validateCreateLandingZoneMonitoring = [
  uuidBody('applicationId'),
  stringBody('monitoringName', { length: { ...MONITORING_NAME_LENGTH } }),
  stringBody('lzMonitoringType', false, {
    isIn: ['fileCount', 'spaceUsage', 'fileMovement'],
  }),
  stringBody('description', { length: { ...DESCRIPTION_LENGTH } }),
  uuidBody('clusterId'),
  objectBody('metaData'),
];

// Validate application ID parameter for getting all landing zone monitorings
const validateApplicationId = [uuidParam('applicationId')];

// Validate ID parameter for getting single landing zone monitoring
const validateId = [uuidParam('id')];

// Validate landing zone monitoring update payload
const validateUpdateLandingZoneMonitoring = [
  uuidBody('id'),
  uuidBody('applicationId', true),
  stringBody('monitoringName', true, { length: { ...MONITORING_NAME_LENGTH } }),
  stringBody('lzMonitoringType', true, {
    isIn: ['fileCount', 'spaceUsage', 'fileMovement'],
  }),
  stringBody('description', { length: { ...DESCRIPTION_LENGTH } }),
  uuidBody('clusterId', true),
  objectBody('metaData', true),
  booleanBody('isActive', true),
  uuidBody('lastUpdatedBy', true),
];

// Validate toggle status request
const validateToggleStatus = [
  arrayBody('ids', false, { arrMin: 1 }),
  uuidBody('ids.*'),
  booleanBody('isActive'),
];

// Validate evaluate request (approve/reject)
const validateEvaluateLandingZoneMonitoring = [
  arrayBody('ids', false, { arrMin: 1 }),
  uuidBody('ids.*'),
  booleanBody('isActive', true),
  stringBody('approvalStatus', false, {
    isIn: ['approved', 'rejected', 'pending'],
  }),
  stringBody('approverComment', false, { length: { ...COMMENT_LENGTH } }),
];

// Validate bulk update payload
const validateBulkUpdatePayload = [
  arrayBody('updatedData', false, { arrMin: 1 }),
  objectBody('updatedData.*'),
  uuidBody('updatedData.*.id'),
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
