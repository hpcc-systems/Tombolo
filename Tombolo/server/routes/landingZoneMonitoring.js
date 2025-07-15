// Imports from libraries
const express = require('express');
const router = express.Router();

// Middlewares
const {
  validateClusterId,
  validateFileListParams,
  validateCreateLandingZoneMonitoring,
  validateApplicationId,
  validateId,
  validateUpdateLandingZoneMonitoring,
  validateEvaluateLandingZoneMonitoring,
  validateToggleStatus,
  validateIds,
  validateBulkUpdatePayload,
} = require('../middlewares/landingZoneMonitoringMiddleware');

// Controllers
const {
  getDropzonesForACluster,
  getFileList,
  createLandingZoneMonitoring,
  getAllLandingZoneMonitorings,
  getLandingZoneMonitoringById,
  updateLandingZoneMonitoring,
  deleteLandingZoneMonitoring,
  evaluateLandingZoneMonitoring,
  toggleLandingZoneMonitoringStatus,
  bulkDeleteLandingZoneMonitoring,
  bulkUpdateLzMonitoring,
} = require('../controllers/landingZoneMonitoringController');

router.post(
  '/',
  validateCreateLandingZoneMonitoring,
  createLandingZoneMonitoring
);
router.get('/getDropzones', validateClusterId, getDropzonesForACluster);
router.get('/fileList', validateFileListParams, getFileList);
router.get(
  '/all/:applicationId',
  validateApplicationId,
  getAllLandingZoneMonitorings
);
router.get('/:id', validateId, getLandingZoneMonitoringById);
router.patch(
  '/',
  validateUpdateLandingZoneMonitoring,
  updateLandingZoneMonitoring
);
router.patch(
  '/evaluate',
  validateEvaluateLandingZoneMonitoring,
  evaluateLandingZoneMonitoring
);
router.delete('/bulkDelete', validateIds, bulkDeleteLandingZoneMonitoring);
router.delete('/:id', validateId, deleteLandingZoneMonitoring);

router.patch(
  '/toggleStatus',
  validateToggleStatus,
  toggleLandingZoneMonitoringStatus
);
router.patch('/bulkUpdate', validateBulkUpdatePayload, bulkUpdateLzMonitoring);

// export the router
module.exports = router;
