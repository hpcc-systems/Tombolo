// Validate add user inputs using express validator
const { body, param, validationResult } = require("express-validator");
const logger = require("../config/logger");

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
  body("password")
    .isString()
    .notEmpty()
    .withMessage("Password is required"),
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



// Exports
module.exports = {
  validateNewUserPayload,
  validateLoginPayload,
};
