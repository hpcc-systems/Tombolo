// Validate add user inputs using express validator
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const logger = require("../config/logger");
const models = require("../models");

const User = models.user;

// Validate registration payload
const validateNewUserPayload = [
  body("registrationMethod")
    .isString()
    .notEmpty()
    .withMessage("Registration method is required")
    .isIn(["traditional", "microsoft"])
    .withMessage(
      "Registration method must be either 'traditional' or 'microsoft'"
    ),
  body("firstName")
    .isString()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .isString()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .withMessage("Email address is not valid")
    .notEmpty()
    .withMessage("Email is required")
    .isLength({ max: 100 })
    .withMessage("Email must be less than 100 characters"),
  body("password")
    .if(body("registrationMethod").equals("traditional"))
    .isString()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[\W_]/)
    .withMessage("Password must contain at least one special character"),
  body("metaData")
    .isObject()
    .optional()
    .withMessage("Meta data must be an object if provided"),
  (req, res, next) => {
    const errors = validationResult(req).array();
    const errorString = errors.map((e) => e.msg).join(", ");
    if (errors.length > 0) {
      logger.error(`Update user: ${errorString}`);
      return res.status(400).json({ success: false, message: errorString });
    }
    next();
  },
];

// Validate login payload
const validateLoginPayload = [
  body("email")
    .isEmail()
    .withMessage("Email address is not valid")
    .notEmpty()
    .withMessage("Email is required")
    .isLength({ max: 100 })
    .withMessage("Email must be less than 100 characters"),
  body("password").isString().notEmpty().withMessage("Password is required"),
  (req, res, next) => {
    const errors = validationResult(req).array();
    const errorString = errors.map((e) => e.msg).join(", ");
    if (errors.length > 0) {
      logger.error(`Login: ${errorString}`);
      return res.status(400).json({ success: false, message: errorString });
    }
    next();
  },
];

const validateEmailDuplicate = [
  async (req, res, next) => {
    const { email } = req.body;
    const message = "Email already in use";
    const user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({
        success: false,
        message: message,
        formErrors: {
          email: {
            errors: message,
          },
        },
      });
    }
    next();
  },
];

// Validate valid access token is present in request header
const verifyValidTokenExists = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.error("Authorization: Access token not provided");
    return res
      .status(401)
      .json({ success: false, message: "Access token not provided" });
  }

  const accessToken = authHeader.split(" ")[1];

  try {
    // Verify the token (checks for tampering and expiration)
    jwt.verify(accessToken, process.env.JWT_SECRET);

    // Attach token to req object for further processing in the controller
    req.accessToken = accessToken;
    next(); // Proceed to the controller
  } catch (err) {
    logger.error("Authorization: Invalid or expired access token");
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired access token" });
  }
};

// Validate email address in in request body
const validatePasswordResetRequestPayload = [
  body("email")
    .isEmail()
    .withMessage("Email address is not valid")
    .notEmpty()
    .withMessage("Email is required")
    .isLength({ max: 100 })
    .withMessage("Email must be less than 100 characters"),
  (req, res, next) => {
    const errors = validationResult(req).array();
    const errorString = errors.map((e) => e.msg).join(", ");
    if (errors.length > 0) {
      logger.error(`Reset password: ${errorString}`);
      return res.status(400).json({ success: false, message: errorString });
    }
    next();
  },
];

//validateResetPasswordPayload - comes in request body - token must be present and must be UUID, password must be present and meet password requirements
const validateResetPasswordPayload = [
  body("token")
    .isString()
    .notEmpty()
    .withMessage("Token is required")
    .isUUID()
    .withMessage("Token is not valid"),
  body("password")
    .isString()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[\W_]/)
    .withMessage("Password must contain at least one special character"),
  (req, res, next) => {
    const errors = validationResult(req).array();
    const errorString = errors.map((e) => e.msg).join(", ");
    if (errors.length > 0) {
      logger.error(`Reset password: ${errorString}`);
      return res.status(400).json({ success: false, message: errorString });
    }
    next();
  },
];

// Verify if the request body has code -> Auth code from azure
const validateAzureAuthCode = [
  body("code").isString().notEmpty().withMessage("Code is required"),
  (req, res, next) => {
    const errors = validationResult(req).array();
    const errorString = errors.map((e) => e.msg).join(", ");
    if (errors.length > 0) {
      logger.error(`Azure auth code: ${errorString}`);
      return res.status(400).json({ success: false, message: errorString });
    }
    next();
  },
];

// Exports
module.exports = {
  validateNewUserPayload,
  validateLoginPayload,
  validateEmailDuplicate,
  verifyValidTokenExists,
  validatePasswordResetRequestPayload,
  validateResetPasswordPayload,
  validateAzureAuthCode,
};
