const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const logger = require('../config/logger');
const model = require('../models');
const {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookie,
} = require('../utils/authUtil');
const { isTokenBlacklisted } = require('../utils/tokenBlackListing');
const { generateAndSetCSRFToken } = require('../utils/authUtil');

const RefreshTokens = model.RefreshTokens;
const User = model.user;
const UserRoles = model.UserRoles;
const RoleTypes = model.RoleTypes;

// Main middleware function
const tokenValidationMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    // Declare decoded variable properly
    const decoded = await verifyToken(token, process.env.JWT_SECRET);
    req.user = decoded;

    // If token is blacklisted - return unauthorized
    if (isTokenBlacklisted(decoded.tokenId)) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: Token no longer valid' });
    }

    // Put access token in cookie
    setTokenCookie(res, token);

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const tokenDetails = await handleExpiredToken(token);
      if (tokenDetails.sessionExpired) {
        // Session expired block so refresh token has expired meaning user needs to log in again
        res.clearCookie('token', {
          httpOnly: true,
          secure: true,
          sameSite: 'Strict',
        });
        return res.status(401).json({
          message: 'Unauthorized: Session expired, Please Log in again.',
        });
      } else {
        logger.info('token expired, refreshing');
        // Token expired, but session is still valid block so we need to refresh the token cookie and the csrf token
        await setTokenCookie(res, tokenDetails.newAccessToken);

        await generateAndSetCSRFToken(req, res, tokenDetails.newAccessToken);

        // Update req.user with new token details
        req.user = await jwt.decode(tokenDetails.newAccessToken);

        next();
      }
    } else {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
  }
};

// Function to verify token
const verifyToken = (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

// Function to handle expired tokens and refresh tokens
const handleExpiredToken = async token => {
  try {
    const decodedToken = jwt.decode(token, process.env.JWT_SECRET);
    const { id: userId, tokenId } = decodedToken;

    // Check if corresponding refresh token exists in DB
    const refreshToken = await RefreshTokens.findOne({
      where: { id: tokenId },
    });

    if (!refreshToken) {
      return {
        sessionExpired: true,
        newAccessToken: null,
      };
    }

    // Get fresh user details
    const user = await User.findOne({
      where: { id: userId },
      include: [
        {
          model: UserRoles,
          attributes: ['id'],
          as: 'roles',
          include: [
            {
              model: RoleTypes,
              as: 'role_details',
              attributes: ['id', 'roleName'],
            },
          ],
        },
      ],
    });

    const userObj = user.toJSON();
    delete userObj.hash;
    const newTokenId = uuidv4();
    const newAccessToken = generateAccessToken({
      ...userObj,
      tokenId: newTokenId,
    });

    const newRefreshToken = generateRefreshToken({ tokenId: newTokenId });

    // Save new refresh token in DB
    await RefreshTokens.create({
      id: newTokenId,
      userId: user.id,
      token: newRefreshToken,
      deviceInfo: refreshToken.deviceInfo,
      iat: refreshToken.iat,
      exp: refreshToken.exp,
    });

    // Remove old refresh token from DB
    await refreshToken.destroy();

    return {
      sessionExpired: false,
      newAccessToken,
    };
  } catch (err) {
    // Log error and return error object instead of using res directly
    logger.error(`Error in handleExpiredToken: ${err.message}`);
    return {
      sessionExpired: true,
      newAccessToken: null,
    };
  }
};

module.exports = { tokenValidationMiddleware };
