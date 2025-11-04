const {
  NAME_LENGTH,
  uuidBody,
  stringBody,
  emailBody,
  booleanBody,
  arrayBody,
  paramUuids,
  bodyUuids,
} = require('./commonMiddleware');

const validateUserId = [paramUuids.id];
const validateUserIdInBody = [bodyUuids.id];

// Validate update payload
const validateUpdateUserPayload = [
  stringBody('firstName', true, { length: { ...NAME_LENGTH } }),
  stringBody('lastName', true, { length: { ...NAME_LENGTH } }),
  emailBody('email', true),
  stringBody('registrationMethod', true, {
    isIn: ['traditional', 'azure'],
  }),
  booleanBody('verifiedUser', true),
  stringBody('registrationStatus', true, {
    isIn: ['pending', 'active', 'revoked'],
  }),
];

// Validate new user payload
const validateManuallyCreatedUserPayload = [
  stringBody('firstName', false, { length: { ...NAME_LENGTH } }),
  stringBody('lastName', false, { length: { ...NAME_LENGTH } }),
  emailBody('email'),
  arrayBody('applications'),
  uuidBody('applications.*'),
  arrayBody('roles'),
];

// Validate change password payload - password and new password
const validateChangePasswordPayload = [
  stringBody('currentPassword'),
  stringBody('newPassword', false, { length: { min: 8 } })
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('New password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number')
    .matches(/[\W_]/)
    .withMessage('New password must contain at least one special character'),
];

// Validate bulk delete payload - req body must contain ids array, and each item in the array must be a valid UUID
const validateBulkDeletePayload = [...bodyUuids.arrayIds];

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
  arrayBody('roles', false, { arrMin: 1 }),
  uuidBody('roles.*'),
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
