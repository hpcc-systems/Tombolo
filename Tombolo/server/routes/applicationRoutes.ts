// Library Imports
import express from 'express';

// Local Imports
import { validate } from '../middlewares/validateRequestBody.js';
import {
  validateGetAppByUsername,
  validateGetAppById,
  validateSaveApp,
  validateUnshareApp,
  validateExportApp,
} from '../middlewares/appMiddleware.js';
import {
  shareApplication,
  stopApplicationShare,
  deleteApplication,
  exportApplication,
  saveApplication,
  getApplicationById,
  getApplicationsByUser,
} from '../controllers/applicationController.js';

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

export default router;
