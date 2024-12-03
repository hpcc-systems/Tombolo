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
  validateAzureAuthCode,
} = require("../middlewares/authMiddleware");

// Import user controller
const {
  createBasicUser,
  loginBasicUser,
  logOutBasicUser,
  handlePasswordResetRequest,
  resetPassword,
  createApplicationOwner,
  resetTempPassword,
  verifyEmail,
  loginOrRegisterAzureUser,
} = require("../controllers/authController");

// Basic (Traditional) User Routes ----------------------------------------------------------------------------
router.post(
  "/registerApplicationOwner",
  validateNewUserPayload,
  validateEmailDuplicate,
  createApplicationOwner
); // Create an owner ( Traditional )
router.post(
  "/registerBasicUser",
  validateNewUserPayload,
  validateEmailDuplicate,
  createBasicUser
); // Create a new user ( Traditional )
router.post("/loginBasicUser", validateLoginPayload, loginBasicUser); // Login user ( Traditional )
router.post("/logoutBasicUser", verifyValidTokenExists, logOutBasicUser); // Logout user
router.post(
  "/handlePasswordResetRequest",
  validatePasswordResetRequestPayload,
  handlePasswordResetRequest
); // Reset password
router.post("/resetPassword", validateResetPasswordPayload, resetPassword); // Reset password
router.post(
  "/resetTempPassword",
  validateResetPasswordPayload,
  resetTempPassword
); // Complete registration by resetting temporary password
router.post("/verifyEmail", verifyEmail); // Verify email
// TODO - Forgot password route

// OAuth 2.0 User Routes ----------------------------------------------------------------------------
//Login or register with azure user
router.post(
  "/loginOrRegisterAzureUser",
  validateAzureAuthCode,
  loginOrRegisterAzureUser
);

module.exports = router;
