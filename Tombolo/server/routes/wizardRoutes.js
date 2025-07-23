const express = require('express');

const router = express.Router();

const {
  createInstanceSettingFirstRun,
} = require('../controllers/wizardController');
const { validate } = require('../middlewares/validateRequestBody');
const { validateWizardPayload } = require('../middlewares/wizardMiddleware');

// Create a new instance setting -- only accessible when no users exist for wizard
router.post(
  '/firstRun',
  validate(validateWizardPayload),
  createInstanceSettingFirstRun
);

module.exports = router;
