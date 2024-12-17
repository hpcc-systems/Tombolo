// Imports
const router = require("express").Router();
const {
  validateUserId,
  validateSessionId,
} = require("../middlewares/sessionMiddleWare");
const { validateUserRole } = require("../middlewares/rbacMiddleware");
const role = require("../config/roleTypes");

//Import Controllers
const {
  activeSessionsByUserId,
  destroyOneActiveSession,
  destroyActiveSessions,
} = require("../controllers/sessionController");

//TODO - Add guards so users can only destroy their own sessions
router.delete(
  "/destroyActiveSession/:sessionId",
  validateSessionId,
  destroyOneActiveSession
); // Destroy single active session

// All routes below is accessible only by users with role "owner" and "administrator"
router.use(validateUserRole([role.OWNER, role.ADMIN]));

// Router
router.get("/getActiveSessions/:id", validateUserId, activeSessionsByUserId); // Get active sessions
router.delete(
  "/destroyActivateSessions/all/:id",
  validateUserId,
  destroyActiveSessions
); // Destroy all active sessions

// Export router
module.exports = router;
