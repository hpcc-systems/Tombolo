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
} = require("../middlewares/userMiddleware");


// Import user controller
const {
  deleteUser,
  updateBasicUserInfo,
  getUser,
  getAllUsers,
  changePassword,
  bulkDeleteUsers,
  bulkUpdateUsers,
  updateUserRoles,
} = require("../controllers/userController");
const { validateUserRole } = require("../middlewares/rbacMiddleware");


// TODO - Add guards so only users can change their own password
router.patch("/change-password/:id", validateUserId, validateChangePasswordPayload, changePassword); // Change password

// All routes below is accessible only by users with role "owner" and "administrator"
router.use(validateUserRole([role.OWNER, role.ADMIN]));

// Routes
router.get("/", getAllUsers); // Get all users
router.get("/:id", validateUserId, getUser); // Get a user by id
router.delete("/bulk-delete", validateBulkDeletePayload, bulkDeleteUsers); // Bulk delete users
router.delete("/:id",  validateUserId, deleteUser); // Delete a user by id
router.patch("/bulk-update",  validateBulkUpdatePayload, bulkUpdateUsers); // Bulk update users
router.patch("/:id",  validateUserId, validateUpdateUserPayload, updateBasicUserInfo); // Update a user by id
router.patch("/roles/update/:id",  validateUserId, validatePatchUserRolesPayload, updateUserRoles); // Update a user by id

//Export 
module.exports = router;