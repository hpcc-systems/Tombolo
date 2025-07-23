// Imports
const router = require('express').Router();
const {
  validateUserId,
  validateSessionId,
} = require('../middlewares/sessionMiddleWare');
const { validateUserRole } = require('../middlewares/rbacMiddleware');
const { validate } = require('../middlewares/validateRequestBody');
const role = require('../config/roleTypes');

//Import Controllers
const {
  activeSessionsByUserId,
  destroyOneActiveSession,
  destroyActiveSessions,
} = require('../controllers/sessionController');

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
module.exports = router;
