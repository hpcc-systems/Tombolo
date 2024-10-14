const express = require("express");
const router = express.Router();

// Import user middleware
const {
  validateNewUserPayload,
  validateLoginPayload,
  validateEmailDuplicate,
  verifyValidTokenExists,
  validatePasswordResetRequestPayload,
  validateResetPasswordPayload,
} = require("../middlewares/authMiddleware");

// Import user controller
const {
  createBasicUser,
  loginBasicUser,
  logOutBasicUser,
  handlePasswordResetRequest,
  resetPassword,
  createApplicationOwner,
} = require("../controllers/authController");

// Basic User Routes
router.post(
  "/registerApplicationOwner",
  validateNewUserPayload,
  validateEmailDuplicate,
  createApplicationOwner
); // Create a new user ( Traditional )
router.post(
  "/registerBasicUser",
  validateNewUserPayload,
  validateEmailDuplicate,
  createBasicUser
); // Create a new user ( Traditional )
router.post("/loginBasicUser", validateLoginPayload, loginBasicUser); // Login user ( Traditional )
router.post("/registerBasicUser", validateNewUserPayload, createBasicUser); // Create a new user ( Traditional )
router.post("/logoutBasicUser", verifyValidTokenExists, logOutBasicUser); // Logout user
router.post(
  "/handlePasswordResetRequest",
  validatePasswordResetRequestPayload,
  handlePasswordResetRequest
); // Reset password
router.post("/resetPassword", validateResetPasswordPayload, resetPassword); // Reset password

// router.post("/registerOAuthUser" ); // Register  user ( OAuth )
// router.post("/loginOAuthUser" ); // Login user ( OAuth )
// Forgot password route

module.exports = router;
