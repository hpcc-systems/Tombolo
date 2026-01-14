// Library Imports
const express = require('express');

// Local Imports
const { validate } = require('../middlewares/validateRequestBody');
const {
  validateGetAppByUsername,
  validateGetAppById,
  validateSaveApp,
  validateUnshareApp,
  validateExportApp,
} = require('../middlewares/appMiddleware');
const {
  shareApplication,
  stopApplicationShare,
  deleteApplication,
  exportApplication,
  saveApplication,
  getApplicationById,
  getApplicationsByUser,
} = require('../controllers/applicationController');

// Constants & Config
const router = express.Router();

// Get all public apps and the ones that are associated with the user
router.get('/app_list', getApplicationsByUser);

router.get(
  '/appListByUsername',
  validate(validateGetAppByUsername),
  getApplicationsByUser
);

router.get('/app', validate(validateGetAppById), getApplicationById);

router.post('/saveApplication', validate(validateSaveApp), saveApplication);

// DELETE APPLICATION
router.post('/deleteApplication', deleteApplication);

// SHARE APPLICATION
router.post('/shareApplication', shareApplication);

// UN-SHARE APPLICATION
router.post(
  '/stopApplicationShare',
  validate(validateUnshareApp),
  stopApplicationShare
);

router.post('/export', validate(validateExportApp), exportApplication);

module.exports = router;
