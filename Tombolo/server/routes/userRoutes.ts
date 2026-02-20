import express from 'express';
const router = express.Router();

import role from '../config/roleTypes.js';

// Import user middleware
import {
  validateUserId,
  validateUpdateUserPayload,
  validateChangePasswordPayload,
  validateBulkDeletePayload,
  // validateBulkUpdatePayload,
  validatePatchUserRolesPayload,
  validateManuallyCreatedUserPayload,
  validateUserIdInBody,
} from '../middlewares/userMiddleware.js';
import { validate } from '../middlewares/validateRequestBody.js';

// Import user controller
import {
  createUser,
  deleteUser,
  updateBasicUserInfo,
  getUser,
  getAllUsers,
  changePassword,
  bulkDeleteUsers,
  // bulkUpdateUsers,
  updateUserRoles,
  updateUserApplications,
  resetPasswordForUser,
  unlockAccount,
} from '../controllers/userController.js';

import { validateUserRole } from '../middlewares/rbacMiddleware.js';

// TODO - Add guards so only users can change their own password
router.patch(
  '/change-password/:id',
  validate(validateUserId, validateChangePasswordPayload),
  changePassword
); // Change password
router.patch(
  '/:id',
  validate(validateUserId, validateUpdateUserPayload),
  updateBasicUserInfo
); // Update a user by id

router.use(validateUserRole([role.OWNER, role.ADMIN])); // All routes below this line will require the user to be an owner or admin
// Routes
router.post('/', validate(validateManuallyCreatedUserPayload), createUser); // Create a new user
router.get('/', getAllUsers); // Get all users
router.get('/:id', validate(validateUserId), getUser); // Get a user by id
router.delete(
  '/bulk-delete',
  validate(validateBulkDeletePayload),
  bulkDeleteUsers
); // Bulk delete users
router.delete('/:id', validate(validateUserId), deleteUser); // Delete a user by id
// router.patch("/bulk-update", validate(validateBulkUpdatePayload), bulkUpdateUsers); // Bulk update users
router.patch(
  '/roles/update/:id',
  validate(validateUserId, validatePatchUserRolesPayload),
  updateUserRoles
); // Update a user by id
router.patch(
  '/applications/:id',
  validate(validateUserId),
  updateUserApplications
); // Update a user's applications
router.post(
  '/reset-password-for-user',
  validate(validateUserIdInBody),
  resetPasswordForUser
); // Reset password for user
router.post('/unlock-account', validate(validateUserIdInBody), unlockAccount); // Unlock account

export default router;
