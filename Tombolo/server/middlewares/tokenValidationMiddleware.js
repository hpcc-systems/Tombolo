const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const logger = require("../config/logger");
const model = require("../models");
const {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookie,
} = require("../utils/authUtil");
const { isTokenBlacklisted } = require("../utils/tokenBlackListing");

const RefreshTokens = model.RefreshTokens;
const User = model.user;
const UserRoles = model.UserRoles;
const RoleTypes = model.RoleTypes;

// Main middleware function
const tokenValidationMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    decoded = await verifyToken(token, process.env.JWT_SECRET);
    req.user = decoded;

    // If token is blacklisted - return unauthorized
    if (isTokenBlacklisted(decoded.tokenId)) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token no longer valid" });
    }

    //put access token in cookie
    setTokenCookie(res, token);

    // return orignal cookie if it is still valid
    // res.cookie("token", token, {
    //   maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "Strict",
    // });

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      const tokenDetails = await handleExpiredToken(token);
      if (tokenDetails.sessionExpired) {
        // Remove cookie
        res.clearCookie("token", {
          httpOnly: true,
          secure: true,
          sameSite: "Strict",
        });
        return res.status(401).json({
          message: "Unauthorized: Session expired, Please Log in again.",
        });
      } else {
        // Attach new access token to response header

        //put access token in cookie
        setTokenCookie(res, tokenDetails.newAccessToken);

        // res.cookie("token", tokenDetails.newAccessToken, {
        //   maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        //   httpOnly: true,
        //   secure: true,
        //   sameSite: "Strict",
        // });
        // res.setHeader("Authorization", `Bearer ${tokenDetails.newAccessToken}`);
        next();
      }
    } else {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
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
const handleExpiredToken = async (token) => {
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
          attributes: ["id"],
          as: "roles",
          include: [
            {
              model: RoleTypes,
              as: "role_details",
              attributes: ["id", "roleName"],
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

    // remove old refresh token from DB
    await refreshToken.destroy();

    return {
      sessionExpired: false,
      newAccessToken,
    };
  } catch (err) {
    logger.error(err.message);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = { tokenValidationMiddleware };
