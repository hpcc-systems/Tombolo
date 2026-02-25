import express from 'express';
const router = express.Router();

// Import middlewares
import { validateUserRole } from '../middlewares/rbacMiddleware.js';
import { validateInstancePayload } from '../middlewares/instanceMiddleware.js';

// Import controllers
import {
  getInstanceSetting,
  updateInstanceSetting,
} from '../controllers/instanceController.js';
import role from '../config/roleTypes.js';

// Routes only accessible by OWNER and ADMIN
router.use(validateUserRole([role.OWNER, role.ADMIN]));

// Routes
router.get('/', getInstanceSetting);
router.put('/', validateInstancePayload, updateInstanceSetting);

// Export
export default router;
