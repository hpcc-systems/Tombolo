const express = require("express");
const router = express.Router();

// Import user middleware
const {
  validateNewUserPayload,
  validateLoginPayload,
  validateEmailDuplicate,
} = require("../middlewares/authMiddleware");

// Import user controller
const {
  createBasicUser,
  loginBasicUser,
} = require("../controllers/authController");

// Routes
router.post(
  "/registerBasicUser",
  validateNewUserPayload,
  validateEmailDuplicate,
  createBasicUser
); // Create a new user ( Traditional )
router.post("/loginBasicUser", validateLoginPayload, loginBasicUser); // Login user ( Traditional )
// router.post("/registerOAuthUser" ); // Register  user ( OAuth )
// router.post("/loginOAuthUser" ); // Login user ( OAuth )
// Forgot password route

module.exports = router;
