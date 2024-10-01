const jwt = require("jsonwebtoken");
const models = require("../models");

const RefreshTokens = models.RefreshTokens;

// Get all active sessions
const activeSessionsByUserId = async (req, res) => {
  try {
    // Get user id from the token
    const { id } = req.params;

    // Find all sessions for the user
    const sessions = await RefreshTokens.findAll({
      where: { userId: id },
    });

    const activeSessions = sessions.filter((session) => {
      try {
        const token = session.token;
        jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        return true;
      } catch (err) {
        return false;
      }
    });

    // response
    res.status(200).json({ success: true, data: activeSessions });
  } catch (err) {
    logger.error(`Get active sessions: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Destroy one active session
const destroyOneActiveSession = async (req, res) => {
  try {
    // Get user id from the token
    const { sessionId } = req.params;

    // Destroy all sessions for the user
    const destroyedSessions = await RefreshTokens.destroy({
      where: { id: sessionId },
    });

    //TODO - Blacklist associated access token

    // response
    res.status(200).json({
      success: true,
      message: `${destroyedSessions} sessions destroyed`,
    });
  } catch (err) {
    logger.error(`Destroy active sessions: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Destroy all active sessions
const destroyActiveSessions = async (req, res) => {
  try {
    // Get user id from the token
    const { id } = req.params;

    // Destroy all sessions for the user
    const destroyedSessions = await RefreshTokens.destroy({
      where: { userId: id },
    });

    //TODO - Blacklist all associated access tokens

    // response
    res.status(200).json({
      success: true,
      message: `${destroyedSessions} sessions destroyed`,
    });
  } catch (err) {
    logger.error(`Destroy active sessions: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};


//Exports
module.exports = {
  activeSessionsByUserId,
  destroyOneActiveSession,
  destroyActiveSessions,
};