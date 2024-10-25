const jwt = require("jsonwebtoken");

const model = require("../models");
const User = model.user;
const UserRoles = model.UserRoles;
const RoleTypes = model.RoleTypes;
const user_application = model.user_application;
const Application = model.application;

// Generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    user,
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

// Generate refresh token
const generateRefreshToken = (tokenId) => {
  return jwt.sign(
    tokenId,
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
}

// Verify token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

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


//Exports
module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  getAUser,
};