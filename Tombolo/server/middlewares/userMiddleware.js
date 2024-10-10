// Validate add user inputs using express validator
const { body, param, validationResult } = require("express-validator");
const logger = require("../config/logger");

// Validate add user inputs using express validator
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

// Validate user ID
const validateUserId = [
  param("id").isUUID(4).withMessage("User ID must be a valid UUID"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(`Delete user : ${errors.array()[0].msg}`);
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }
    next();
  },
];

// Validate update payload
const validateUpdateUserPayload = [
  body("firstName")
    .isString()
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .isString()
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  (req, res, next) => {
    const errors = validationResult(req).array();
    const errorString = errors.map((e) => e.msg).join(", ");
    if (errors.length > 0) {
      logger.error(`Update user : ${errorString}`);
      return res.status(400).json({ success: false, message: errorString });
    }
    next();
  },
];

// Validate change password payload - password and new password
const validateChangePasswordPayload = [
  body("currentPassword")
    .isString()
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isString()
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("New password must contain at least one number")
    .matches(/[\W_]/)
    .withMessage("New password must contain at least one special character"),
  (req, res, next) => {
    const errors = validationResult(req).array();
    const errorString = errors.map((e) => e.msg).join(", ");
    if (errors.length > 0) {
      logger.error(`Change password : ${errorString}`);
      return res.status(400).json({ success: false, message: errorString });
    }
    next();
  },
];

// Validate bulk delete payload - req body must contain ids array and each item in array must be a valid UUID
const validateBulkDeletePayload = [
  body("ids")
    .isArray({ min: 1 })
    .withMessage("At least one user ID is required"),
  body("ids.*").isUUID(4).withMessage("All User IDs must be a valid UUIDs"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(`Bulk delete users : ${errors.array()[0].msg}`);
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }
    next();
  },
];

// Validate bulk update payload
const validateBulkUpdatePayload = [
  body("users")
    .isArray({ min: 1 })
    .withMessage("At least one user information is required"),
  body("users.*.id").isUUID(4).withMessage("User ID must be a valid UUID"),
  body("users.*.verifiedUser")
    .optional()
    .isBoolean()
    .withMessage("Verified user must be a boolean"),
  body("users.*.registrationStatus")
    .optional()
    .isIn(["pending", "active", "revoked"])
    .withMessage(
      "Registration status must be one of 'pending', 'active', 'revoked'"
    ),
  body("users.*.metaData")
    .optional()
    .isObject()
    .withMessage("Metadata must be an object"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(`Bulk update users : ${errors.array()[0].msg}`);
      const errorString = errors
        .array()
        .map((e) => e.msg)
        .join(", ");
      return res.status(400).json({ success: false, message: errorString });
    }
    next();
  },
];

// req.body must roles array and must be valid uuid
const validatePatchUserRolesPayload = [
  body("roles")
    .isArray({ min: 1 })
    .withMessage("At least one role ID is required"),
  body("roles.*").isUUID(4).withMessage("All role IDs must be a valid UUIDs"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(`Patch user roles : ${errors.array()[0].msg}`);
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }
    next();
  },
];

module.exports = {
  validateNewUserPayload,
  validateUserId,
  validateUpdateUserPayload,
  validateChangePasswordPayload,
  validateBulkDeletePayload,
  validateBulkUpdatePayload,
  validatePatchUserRolesPayload,
};
