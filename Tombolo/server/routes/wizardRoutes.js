const express = require("express");

const router = express.Router();

const {
  createInstanceSettingFirstRun,
} = require("../controllers/wizardController");

const { validateNoUsersExist } = require("../middlewares/wizardMiddleware");

//always run validate no user exists middleware
router.use(validateNoUsersExist());

// Create a new instance setting -- only accesible when no users exist for wizard
router.post("/firstRun", createInstanceSettingFirstRun);

module.exports = router;
