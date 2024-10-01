// Imports
const router = require("express").Router();
const { validateUserId, validateSessionId } = require("../middlewares/sessionMiddleWare");

//Import Controllers 
const {  activeSessionsByUserId,
  destroyOneActiveSession,
  destroyActiveSessions,} = require("../controllers/sessionController");

// Router
router.get("/getActiveSessions/:id", validateUserId, activeSessionsByUserId); // Get active sessions
router.delete("/destroyActivateSessions/all/:id",validateUserId,destroyActiveSessions); // Destroy all active sessions
router.delete("/destroyActiveSession/:sessionId",  validateSessionId,destroyOneActiveSession); // Destroy single active session


// Export router
module.exports = router;