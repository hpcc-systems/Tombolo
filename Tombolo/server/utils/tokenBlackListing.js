const { TokenBlackList } = require('../models');
const logger = require('../config/logger');

// Sync blacklisted tokens from DB to RAM
(async () => {
  try {
    logger.info('Syncing blacklisted tokens from the database');
    const tokens = await TokenBlackList.findAll();
    tokens.forEach(({ id, exp }) => {
      tokenBlacklist.set(id, exp);
    });
  } catch (err) {
    logger.error('Error syncing blacklisted tokens:', err);
  }
})();

// Create the Map (tokenId as key and expiration time as value)
const tokenBlacklist = new Map();

// Function to add tokens to the blacklist
async function blacklistToken({ tokenId, exp }) {
  tokenBlacklist.set(tokenId, exp);

  // Save token to the database
  await TokenBlackList.create({ id: tokenId, exp });
}

// Function to check if a token is blacklisted
function isTokenBlacklisted(tokenId) {
  return tokenBlacklist.has(tokenId);
}

// Function to remove token from the blacklist manually
function removeBlacklistedToken(token) {
  tokenBlacklist.delete(token);
}

let blacklistTokenIntervalId;

// Periodically check and remove expired tokens from the Map
blacklistTokenIntervalId = setInterval(async () => {
  logger.info('Cleaning up expired blacklisted tokens');
  const now = Date.now();
  tokenBlacklist.forEach((expiresAt, token) => {
    if (now > expiresAt) {
      tokenBlacklist.delete(token); // Remove expired token
      // Remove token from the database
      TokenBlackList.destroy({ where: { id: token } });
    }
  });
}, 900000);

// Export the Map and functions
module.exports = {
  tokenBlacklist,
  blacklistToken,
  isTokenBlacklisted,
  removeBlacklistedToken,
  blacklistTokenIntervalId,
};
