const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

const model = require("../models");
const User = model.user;
const UserRoles = model.UserRoles;
const RoleTypes = model.RoleTypes;
const user_application = model.user_application;
const Application = model.application;
const { generateToken } = require("../middlewares/csrfMiddleware");
const csrfHeaderName =
  process.env.NODE_ENV === "production"
    ? "__Host-prod.x-csrf-token"
    : "x-csrf-token";

// Generate access token
const generateAccessToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "15m" });
};

// Generate refresh token
const generateRefreshToken = (tokenId) => {
  return jwt.sign(tokenId, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// Verify token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// Get user by E-mail or ID
// identifier is either email or id , example : getAUser({id: 'xyz'}) or getAUser({email: 'xyz@xyz.com'})
const getAUser = async (identifier) => {
  return await User.findOne({
    where: { ...identifier },
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
      {
        model: user_application,
        attributes: ["id"],
        as: "applications",
        include: [
          {
            model: Application,
            attributes: ["id", "title", "description"],
          },
        ],
      },
    ],
  });
};

const setTokenCookie = async (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  });
  return true;
};

const generateAndSetCSRFToken = async (req, res, accessToken) => {
  try {
    //set token in req as well so csrf token can be generated
    req.cookies.token = accessToken;

    const csrfToken = generateToken(req, res, true);

    //attach csrfToken to x-csrf-token header
    res.setHeader(csrfHeaderName, csrfToken);

    return true;
  } catch (e) {
    logger.error("Error while generating csrf token:" + e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//Exports
module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  getAUser,
  setTokenCookie,
  generateAndSetCSRFToken,
};
