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
} = require('../middlewares/landingZoneMonitoringMiddleware');

// Controllers
const {
  getDropzonesForACluster,
  getFileList,
  createLandingZoneMonitoring,
  getAllLandingZoneMonitorings,
  getLandingZoneMonitoringById,
} = require('../controllers/landingZoneMonitoringController');

// Get Dropzones and associated machines
router.get('/getDropzones', validateClusterId, getDropzonesForACluster);
router.get('/fileList', validateFileListParams, getFileList);
router.post(
  '/',
  validateCreateLandingZoneMonitoring,
  createLandingZoneMonitoring
);
router.get(
  '/all/:applicationId',
  validateApplicationId,
  getAllLandingZoneMonitorings
);
router.get('/:id', validateId, getLandingZoneMonitoringById);

// export the router
module.exports = router;
