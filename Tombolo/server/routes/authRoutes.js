const express = require('express');
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
} = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateRequestBody');

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
  requestPasswordReset,
} = require('../controllers/authController');

// Basic (Traditional) User Routes ----------------------------------------------------------------------------
router.post(
  '/registerApplicationOwner',
  validate(validateNewUserPayload, validateEmailDuplicate),
  createApplicationOwner
); // Create an owner (Traditional)
router.post(
  '/registerBasicUser',
  validate(validateNewUserPayload, validateEmailDuplicate),
  createBasicUser
); // Create a new user (Traditional)
router.post('/loginBasicUser', validate(validateLoginPayload), loginBasicUser); // Login user ( Traditional )
router.post('/logoutBasicUser', verifyValidTokenExists, logOutBasicUser); // Logout user
router.post(
  '/handlePasswordResetRequest',
  validate(validatePasswordResetRequestPayload),
  handlePasswordResetRequest
); // Reset password
router.post(
  '/resetPasswordWithToken',
  validate(validateResetPasswordPayload),
  resetPasswordWithToken
); // Reset Password - Self Requested
router.post(
  '/resetTempPassword',
  validate(validateResetPasswordPayload),
  resetTempPassword
); // Reset Password - Owner/Admin requested through registration flow
router.post('/verifyEmail', verifyEmail); // Verify email
// Resend verification code
router.post(
  '/resendVerificationCode',
  validate(validateEmailInBody),
  resendVerificationCode
); // Resend verification code to user
router.post(
  '/requestPasswordReset',
  validate(validateEmailInBody),
  requestPasswordReset
);
// OAuth 2.0 User Routes ----------------------------------------------------------------------------
//Login or register with azure user
router.post(
  '/loginOrRegisterAzureUser',
  validate(validateAzureAuthCode),
  loginOrRegisterAzureUser
);

//access request
router.post('/requestAccess', validate(validateAccessRequest), requestAccess);

//get user details with password reset token
router.get(
  '/getUserDetailsWithToken/:token',
  validate(validateResetToken),
  getUserDetailsWithToken
);

router.get(
  '/getUserDetailsWithVerificationCode/:token',
  validate(validateResetToken),
  getUserDetailsWithVerificationCode
);

module.exports = router;
