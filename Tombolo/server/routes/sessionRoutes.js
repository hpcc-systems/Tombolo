// Imports
import express from 'express';
const router = express.Router();
import {
  validateUserId,
  validateSessionId,
} from '../middlewares/sessionMiddleware.js';
import { validateUserRole } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validateRequestBody.js';
import role from '../config/roleTypes.js';

//Import Controllers
import {
  activeSessionsByUserId,
  destroyOneActiveSession,
  destroyActiveSessions,
} from '../controllers/sessionController.js';

//TODO - Add guards so users can only destroy their own sessions
router.delete(
  '/destroyActiveSession/:sessionId',
  validate(validateSessionId),
  destroyOneActiveSession
); // Destroy single active session

// Router
router.get(
  '/getActiveSessions/:id',
  validate(validateUserId),
  activeSessionsByUserId
); // Get active sessions
// All routes below is accessible only by users with role "owner" and "administrator"
router.use(validateUserRole([role.OWNER, role.ADMIN]));
router.delete(
  '/destroyActivateSessions/all/:id',
  validate(validateUserId),
  destroyActiveSessions
); // Destroy all active sessions

// Export router
export default router;
