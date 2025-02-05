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
  validateAccessRequest,
  validateEmailInBody,
  validateResetToken,
} = require("../middlewares/authMiddleware");

// Import user controller
const {
  createBasicUser,
  loginBasicUser,
  logOutBasicUser,
  handlePasswordResetRequest,
  createApplicationOwner,
  resetPasswordWithToken,
  resetTempPassword,
  verifyEmail,
  loginOrRegisterAzureUser,
  requestAccess,
  resendVerificationCode,
  getUserDetailsWithToken,
  getUserDetailsWithVerificationCode,
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
router.post(
  "/resetPasswordWithToken",
  validateResetPasswordPayload,
  resetPasswordWithToken
); // Reset Password - Self Requested
router.post(
  "/resetTempPassword",
  validateResetPasswordPayload,
  resetTempPassword
); // Reset Password - Owner/Admin requested through registration flow
router.post("/verifyEmail", verifyEmail); // Verify email
// Resend verification code
router.post(
  "/resendVerificationCode",
  validateEmailInBody,
  resendVerificationCode
); // Resend verification code to user

// OAuth 2.0 User Routes ----------------------------------------------------------------------------
//Login or register with azure user
router.post(
  "/loginOrRegisterAzureUser",
  validateAzureAuthCode,
  loginOrRegisterAzureUser
);

//access request
router.post("/requestAccess", validateAccessRequest, requestAccess);

//get user details with password reset token
router.get(
  "/getUserDetailsWithToken/:token",
  validateResetToken,
  getUserDetailsWithToken
);

router.get(
  "/getUserDetailsWithVerificationCode/:token",
  validateResetToken,
  getUserDetailsWithVerificationCode
);

module.exports = router;
