const express = require("express");
const router = express.Router();

const role = require("../config/roleTypes");

// Import user middleware
const {
  validateUserId,
  validateUpdateUserPayload,
  validateChangePasswordPayload,
  validateBulkDeletePayload,
  validateBulkUpdatePayload,
  validatePatchUserRolesPayload,
  validateManuallyCreatedUserPayload,
  validateUserIdInBody,
} = require("../middlewares/userMiddleware");

// Import user controller
const {
  createUser,
  deleteUser,
  updateBasicUserInfo,
  getUser,
  getAllUsers,
  changePassword,
  bulkDeleteUsers,
  bulkUpdateUsers,
  updateUserRoles,
  updateUserApplications,
  resetPasswordForUser,
} = require("../controllers/userController");

const { validateUserRole } = require("../middlewares/rbacMiddleware");

// TODO - Add guards so only users can change their own password
router.patch(
  "/change-password/:id",
  validateUserId,
  validateChangePasswordPayload,
  changePassword
); // Change password
router.patch(
  "/:id",
  validateUserId,
  validateUpdateUserPayload,
  updateBasicUserInfo
); // Update a user by id

router.use(validateUserRole([role.OWNER, role.ADMIN])); // All routes below this line will require the user to be an owner or admin
// Routes
router.post("/", validateManuallyCreatedUserPayload, createUser); // Create a new user
router.get("/", getAllUsers); // Get all users
router.get("/:id", validateUserId, getUser); // Get a user by id
router.delete("/bulk-delete", validateBulkDeletePayload, bulkDeleteUsers); // Bulk delete users
router.delete("/:id", validateUserId, deleteUser); // Delete a user by id
router.patch("/bulk-update", validateBulkUpdatePayload, bulkUpdateUsers); // Bulk update users
router.patch(
  "/roles/update/:id",
  validateUserId,
  validatePatchUserRolesPayload,
  updateUserRoles
); // Update a user by id
router.patch("/applications/:id",validateUserId, updateUserApplications); // Update a user's applications
router.post("/reset-password-for-user", validateUserIdInBody, resetPasswordForUser); // Reset password for user
//Export
module.exports = router;
