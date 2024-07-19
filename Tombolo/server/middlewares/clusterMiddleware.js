const { body, param, validationResult } = require("express-validator");

// Validate the input for creating a cluster
const validateAddClusterInputs = [
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .isLength({ max: 300 })
    .withMessage("Name must not exceed 300 characters"),
  body("username")
    .optional({ nullable: true })
    .isAlphanumeric()
    .withMessage("Username must be alphanumeric"),
  body("password")
    .optional({ nullable: true })
    .isString()
    .withMessage("Password must be a string")
    .isLength({ max: 200 })
    .withMessage("Password must not exceed 200 characters"),
  body("adminEmails")
    .isArray()
    .withMessage("Emails must be an array")
    .custom((emails) => emails.every((email) => typeof email === "string"))
    .withMessage("All emails must be strings"),
  (req, res, next) => {

    const errors = validationResult(req).array();
    const errorString = errors.map(e => e.msg).join(', ');
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errorString });
    }
    next();
  },
];

// Validate the id
const validateClusterId = [
  param("id").isUUID(4).withMessage("Invalid cluster id"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }
    next();
  },
];

// Validate the input for updating a cluster
const validateUpdateClusterInputs = [
  param("id").isUUID(4).withMessage("Invalid cluster id"),
  body("username")
    .optional({ nullable: true })
    .isAlphanumeric()
    .withMessage("Username must be a alphanumeric"),
  body("password")
    .optional({ nullable: true })
    .isString()
    .withMessage("Password must be a string"),
  body("adminEmails")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Emails must be an array")
    .custom((emails) => emails.every((email) => typeof email === "string"))
    .withMessage("All emails must be strings"),
  (req, res, next) => {
     const errors = validationResult(req).array();
     const errorString = errors.map((e) => e.msg).join(", ");
     if (errors.length > 0) {
       return res.status(400).json({ success: false, message: errorString });
     }
    next();
  },
]; 

module.exports = {
  validateAddClusterInputs,
  validateClusterId,
  validateUpdateClusterInputs,
};
