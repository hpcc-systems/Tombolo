const jwt = require("jsonwebtoken");
const models = require("../models");
const { blacklistToken } = require("../utils/tokenBlackListing");
const logger = require("../config/logger");

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

    // Destroy session/refresh token by Id
    const destroyedSessions = await RefreshTokens.destroy({
      where: { id: sessionId },
    });

    if (destroyedSessions === 0) {
      throw { status: 404, message: "Session not found" };
    }
    // Blacklist associated access token
    // Divide by 1000 to convert to seconds instead of MS. MS gives out of range as value is > 2^31. 2034 problem exists.
    const exp = (Date.now() + 15 * 60 * 1000) / 1000; // Exact exp time for this token is unknown, therefore set to max life i.e - 15 mins

    await blacklistToken({ tokenId: sessionId, exp });

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

    // Find all sessions for the user
    const sessions = await RefreshTokens.findAll({
      where: { userId: id },
    });

    // Destroy all sessions
    const destroyedSessions = await RefreshTokens.destroy({
      where: { userId: id },
    });

    //Blacklist all associated access tokens
    const exp = Date.now() + 15 * 60 * 1000; // Exact exp time for this token is unknown, therefore set to max life i.e - 15 mins
    for (const session of sessions) {
      await blacklistToken({ tokenId: session.id, exp });
    }

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
