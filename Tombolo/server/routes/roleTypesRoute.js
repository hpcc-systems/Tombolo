import express from 'express';
const router = express.Router();

import { getAllRoles } from '../controllers/roleTypesController.js';
import { validateUserRole } from '../middlewares/rbacMiddleware.js';
import role from '../config/roleTypes.js';

// Middleware to get all roles
router.use(
  validateUserRole([role.OWNER, role.ADMIN, role.READER, role.CONTRIBUTOR])
);

// Get all roles
router.get('/', getAllRoles);

export default router;
