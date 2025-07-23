const {
  clusterIdQuery,
  requiredObject,
  requiredArray,
  requiredUuidBody,
  requiredStringQuery,
  requiredBoolean,
  requiredBooleanQuery,
  applicationIdBody,
  requiredStringBody,
  clusterIdBody,
  applicationIdParam,
  idParam,
  idBody,
  optionalUuidBody,
  optionalStringBody,
  optionalObject,
  optionalBoolean,
  DESCRIPTION_LENGTH,
  MONITORING_NAME_LENGTH,
  COMMENT_LENGTH,
} = require('./commonMiddleware');

// Validate cluster id from the query parameters
const validateClusterId = [clusterIdQuery];

// Validate req.body.ids array of UUIDs
const validateIds = [
  requiredArray('ids', { arrMin: 1 }),
  requiredUuidBody('ids.*'),
];

const validateFileListParams = [
  clusterIdQuery,
  requiredStringQuery('DropZoneName'),
  requiredStringQuery('Netaddr'),
  requiredStringQuery('Path'),
  requiredBooleanQuery('DirectoryOnly'),
];

// Validate landing zone monitoring creation payload
const validateCreateLandingZoneMonitoring = [
  applicationIdBody,
  requiredStringBody('monitoringName', { ...MONITORING_NAME_LENGTH }),
  requiredStringBody('lzMonitoringType', {
    isIn: ['fileCount', 'spaceUsage', 'fileMovement'],
  }),
  requiredStringBody('description', { ...DESCRIPTION_LENGTH }),
  clusterIdBody,
  requiredObject('metaData'),
];

// Validate application ID parameter for getting all landing zone monitorings
const validateApplicationId = [applicationIdParam];

// Validate ID parameter for getting single landing zone monitoring
const validateId = [idParam];

// Validate landing zone monitoring update payload
const validateUpdateLandingZoneMonitoring = [
  idBody,
  optionalUuidBody('applicationId'),
  optionalStringBody('monitoringName', { ...MONITORING_NAME_LENGTH }),
  optionalStringBody('lzMonitoringType', {
    isIn: ['fileCount', 'spaceUsage', 'fileMovement'],
  }),
  optionalStringBody('description', { ...DESCRIPTION_LENGTH }),
  optionalUuidBody('clusterId'),
  optionalObject('metaData'),
  optionalBoolean('isActive'),
  optionalUuidBody('lastUpdatedBy'),
];

// Validate toggle status request
const validateToggleStatus = [
  requiredArray('ids', { arrMin: 1 }),
  requiredUuidBody('ids.*'),
  requiredBoolean('isActive'),
];

// Validate evaluate request (approve/reject)
const validateEvaluateLandingZoneMonitoring = [
  requiredArray('ids', { arrMin: 1 }),
  requiredUuidBody('ids.*'),
  optionalBoolean('isActive'),
  requiredStringBody('approvalStatus', {
    isIn: ['approved', 'rejected', 'pending'],
  }),
  requiredStringBody('approverComment', { ...COMMENT_LENGTH }),
];

// Validate bulk update payload
const validateBulkUpdatePayload = [
  requiredArray('updatedData', { arrMin: 1 }),
  requiredObject('updatedData.*'),
  requiredUuidBody('updatedData.*.id'),
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
