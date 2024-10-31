const { body, param, validationResult } = require("express-validator");

const validateInstanceSetting = [
  body("name").notEmpty().withMessage("Name is required"),
  body("value").notEmpty().withMessage("Value is required"),
  body("createdBy").notEmpty().withMessage("CreatedBy is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const validateInstanceId = [
  param("id").isUUID(4).withMessage("Invalid instance setting id"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const validateInstanceUpdate = [
  body("value").notEmpty().withMessage("Value is required"),
  body("updatedBy").notEmpty().withMessage("UpdatedBy is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateInstanceSetting,
  validateInstanceId,
  validateInstanceUpdate,
};
