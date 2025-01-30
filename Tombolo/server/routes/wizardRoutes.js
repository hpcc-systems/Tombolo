const express = require("express");

const router = express.Router();

const {
  createInstanceSettingFirstRun,
} = require("../controllers/wizardController");

const { validateWizardPayload } = require("../middlewares/wizardMiddleware");


// Create a new instance setting -- only accessible when no users exist for wizard
router.post("/firstRun",validateWizardPayload, createInstanceSettingFirstRun);

module.exports = router;
