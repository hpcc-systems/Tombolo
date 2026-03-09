import express from 'express';

const router = express.Router();

import { createInstanceSettingFirstRun } from '../controllers/wizardController.js';
import { validate } from '../middlewares/validateRequestBody.js';
import { validateWizardPayload } from '../middlewares/wizardMiddleware.js';

// Create a new instance setting -- only accessible when no users exist for wizard
router.post(
  '/firstRun',
  validate(validateWizardPayload),
  createInstanceSettingFirstRun
);

export default router;
