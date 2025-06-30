// Imports from libraries
const express = require('express');
const router = express.Router();

// Middlewares
const {
  validateClusterId,
  validateFileListParams,
  validateCreateLandingZoneMonitoring,
} = require('../middlewares/landingZoneMonitoringMiddleware');

// Controllers
const {
  getDropzonesForACluster,
  getFileList,
  createLandingZoneMonitoring,
} = require('../controllers/landingZoneMonitoringController');

// Get Dropzones and associated machines
router.get('/getDropzones', validateClusterId, getDropzonesForACluster);
router.get('/fileList', validateFileListParams, getFileList);

// Create new landing zone monitoring
router.post(
  '/',
  validateCreateLandingZoneMonitoring,
  createLandingZoneMonitoring
);

// export the router
module.exports = router;
