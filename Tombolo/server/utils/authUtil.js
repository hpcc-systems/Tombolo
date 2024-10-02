const jwt = require("jsonwebtoken");

const model = require("../models");

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

//Exports
module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
};