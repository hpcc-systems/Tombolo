const { body, validationResult } = require("express-validator");
const logger = require("../config/logger");

const validateWizardPayload = [
  body("firstName")
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .isLength({ max: 100 })
    .withMessage("Email must be less than 100 characters"),
  body("password")
    .isString()
    .isLength({ min: 8, max: 50 })
    .withMessage("Password must be between 8 and 50 characters"),
  body("name")
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage("Instance name must be between 2 and 50 characters"),
  body("description")
    .isString()
    .isLength({ min: 2, max: 250 })
    .withMessage("Instance description must be between 2 and 250 characters"),
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

module.exports = { validateWizardPayload };
