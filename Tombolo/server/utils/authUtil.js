const jwt = require("jsonwebtoken");

const model = require("../models");
const User = model.user;
const UserRoles = model.UserRoles;

// Generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    user,
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
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

// Refresh access token
const refreshAccessToken = async (refreshToken) => {
  const decoded = verifyRefreshToken(refreshToken);
  const { id } = decoded; // Extract user ID from decoded payload

  // Fetch user roles from database
    const user = await  User.findOne({
        where: { id },
        include: UserRoles
    })

  // Get user roles
    const userRoles = await UserRoles.findAll({
        where: { userId: user.id },
    });

  // Generate new access token
    const accessToken = generateAccessToken(user);
  
};

//Exports
module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  refreshAccessToken
};