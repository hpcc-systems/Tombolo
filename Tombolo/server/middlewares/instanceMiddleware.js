const { body, validationResult } = require("express-validator");

const validateInstancePayload = [
  body("name")
    .optional()
    .isString()
    .withMessage("Name must be a string")
    .isLength({ max: 255 })
    .withMessage("Name must be less than 255 characters"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
  body("supportEmailRecipientsEmail")
    .optional()
    .isEmail()
    .withMessage("Support email recipients email must be a valid email"),
  body("accessRequestEmailRecipientsEmail")
    .optional()
    .isEmail()
    .withMessage("Access request email recipients email must be a valid email"),
  body("supportEmailRecipientsRoles")
    .optional()
    .isArray()
    .withMessage("Support email recipients email must be an array of strings"),
  body("accessRequestEmailRecipientsRoles")
    .optional()
    .isArray()
    .withMessage(
      "Access request email recipients roles must be an array of strings"
    ),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
module.exports = {
  validateInstancePayload,
};
