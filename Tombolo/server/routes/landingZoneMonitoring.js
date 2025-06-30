// Imports from libraries
const express = require('express');
const router = express.Router();

// Middlewares
const {
  validateClusterId,
  validateFileListParams,
  validateCreateLandingZoneMonitoring,
  validateApplicationId,
} = require('../middlewares/landingZoneMonitoringMiddleware');

// Controllers
const {
  getDropzonesForACluster,
  getFileList,
  createLandingZoneMonitoring,
  getAllLandingZoneMonitorings,
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

// export the router
module.exports = router;
