const jwt = require('jsonwebtoken');
const { RefreshToken } = require('../models');
const { blacklistToken } = require('../utils/tokenBlackListing');
const logger = require('../config/logger');
const { verifyToken } = require('../utils/authUtil');
const { sendSuccess, sendError } = require('../utils/response');

// Get all active sessions
const activeSessionsByUserId = async (req, res) => {
  try {
    // Get user id from the token
    const { id } = req.params;

    // Find all sessions for the user
    const sessions = await RefreshToken.findAll({
      where: { userId: id },
    });

    const activeSessions = sessions.filter(session => {
      try {
        const token = session.token;
        jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        return true;
      } catch (err) {
        return false;
      }
    });

    //grab current session token id from the request
    const token = req.cookies.token;
    let decoded = await verifyToken(token, process.env.JWT_SECRET);
    const currentTokenId = decoded.tokenId;

    // Mark the current token
    activeSessions.forEach(session => {
      session.dataValues.current = session.id === currentTokenId;
    });

    // response
    return sendSuccess(
      res,
      activeSessions,
      'Active sessions retrieved successfully'
    );
  } catch (err) {
    logger.error('Get active sessions: ', err);
    return sendError(res, err);
  }
};

// Destroy one active session
const destroyOneActiveSession = async (req, res) => {
  try {
    // Get user id from the token
    const { sessionId } = req.params;

    // Destroy session/refresh token by Id
    const destroyedSessions = await RefreshToken.destroy({
      where: { id: sessionId },
    });

    if (destroyedSessions === 0) {
      throw { status: 404, message: 'Session not found' };
    }
    // Blacklist associated access token
    // Divide by 1000 to convert to seconds instead of MS. MS gives out of range as value is > 2^31. 2034 problem exists.
    const exp = (Date.now() + 15 * 60 * 1000) / 1000; // Exact exp time for this token is unknown, therefore set to max life i.e - 15 mins

    await blacklistToken({ tokenId: sessionId, exp });

    // response
    return sendSuccess(res, null, `${destroyedSessions} sessions destroyed`);
  } catch (err) {
    logger.error('Destroy active sessions: ', err);
    return sendError(res, err);
  }
};

// Destroy all active sessions
const destroyActiveSessions = async (req, res) => {
  try {
    // Get user id from the token
    const { id } = req.params;

    // Find all sessions for the user
    const sessions = await RefreshToken.findAll({
      where: { userId: id },
    });

    // Destroy all sessions
    const destroyedSessions = await RefreshToken.destroy({
      where: { userId: id },
    });

    //Blacklist all associated access tokens
    const exp = Date.now() + 15 * 60 * 1000; // Exact exp time for this token is unknown, therefore set to max life i.e - 15 mins
    for (const session of sessions) {
      await blacklistToken({ tokenId: session.id, exp });
    }

    // response
    return sendSuccess(res, null, `${destroyedSessions} sessions destroyed`);
  } catch (err) {
    logger.error('Destroy active sessions: ', err);
    return sendError(res, err);
  }
};

//Exports
module.exports = {
  activeSessionsByUserId,
  destroyOneActiveSession,
  destroyActiveSessions,
};
