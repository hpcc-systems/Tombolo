const {
  idParam,
  idBody,
  optionalStringBody,
  optionalEmailBody,
  optionalBoolean,
  requiredStringBody,
  requiredEmailBody,
  requiredArray,
  requiredUuidBody,
  NAME_LENGTH,
} = require('./commonMiddleware');

const validateUserId = [idParam];
const validateUserIdInBody = [idBody];

// Validate update payload
const validateUpdateUserPayload = [
  optionalStringBody('firstName', { ...NAME_LENGTH }),
  optionalStringBody('lastName', { ...NAME_LENGTH }),
  optionalEmailBody('email'),
  optionalStringBody('registrationMethod', {
    isIn: ['traditional', 'microsoft'],
  }),
  optionalBoolean('verifiedUser'),
  optionalStringBody('registrationStatus', {
    isIn: ['pending', 'active', 'revoked'],
  }),
];

// Validate new user payload
const validateManuallyCreatedUserPayload = [
  requiredStringBody('firstName', { ...NAME_LENGTH }),
  requiredStringBody('lastName', { ...NAME_LENGTH }),
  requiredEmailBody('email'),
  requiredArray('applications'),
  requiredUuidBody('applications.*'),
  requiredArray('roles'),
];

// Validate change password payload - password and new password
const validateChangePasswordPayload = [
  requiredStringBody('currentPassword'),
  requiredStringBody('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('New password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number')
    .matches(/[\W_]/)
    .withMessage('New password must contain at least one special character'),
];

// Validate bulk delete payload - req body must contain ids array and each item in array must be a valid UUID
const validateBulkDeletePayload = [
  requiredArray('ids'),
  requiredUuidBody('ids.*'),
];

// Validate bulk update payload
// const validateBulkUpdatePayload = [
//   body("users")
//     .isArray({ min: 1 })
//     .withMessage("At least one user information is required"),
//   body("users.*.id").isUUID(4).withMessage("User ID must be a valid UUID"),
//   body("users.*.verifiedUser")
//     .optional()
//     .isBoolean()
//     .withMessage("Verified user must be a boolean"),
//   body("users.*.registrationStatus")
//     .optional()
//     .isIn(["pending", "active", "revoked"])
//     .withMessage(
//       "Registration status must be one of 'pending', 'active', 'revoked'"
//     ),
//   body("users.*.metaData")
//     .optional()
//     .isObject()
//     .withMessage("Metadata must be an object"),
// ];

// req.body must roles array and must be valid uuid
const validatePatchUserRolesPayload = [
  requiredArray('roles', { arrMin: 1 }),
  requiredUuidBody('roles.*'),
];

module.exports = {
  validateManuallyCreatedUserPayload,
  validateUserId,
  validateUserIdInBody,
  validateUpdateUserPayload,
  validateChangePasswordPayload,
  validateBulkDeletePayload,
  // validateBulkUpdatePayload,
  validatePatchUserRolesPayload,
};
