const express = require("express");

const {
  validateInstanceId,
  validateInstanceSetting,
  validateInstanceUpdate,
} = require("../middlewares/instanceMiddleware");
const {
  getInstanceSetting,
  getAllInstanceSettings,
  createInstanceSetting,
  updateInstanceSetting,
  deleteInstanceSetting,
} = require("../controllers/instanceController");
const role = require("../config/roleTypes");

const router = express.Router();

const { validateUserRole } = require("../middlewares/rbacMiddleware");

// Get a single instance setting by ID
router.get("/one/:name", getInstanceSetting);

// Get all instance settings
router.get("/all", getAllInstanceSettings);

// All routes below is accessible only by users with role "owner"
router.use(validateUserRole([role.OWNER]));

// Create a new instance setting
router.post("/", validateInstanceSetting, createInstanceSetting);

// Update an existing instance setting by ID
router.patch(
  "/:id",
  validateInstanceId,
  validateInstanceUpdate,
  updateInstanceSetting
);

// Delete an instance setting by ID
router.delete("/:id", validateInstanceId, deleteInstanceSetting);

module.exports = router;
