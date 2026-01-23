import { TokenBlackList } from '../models';
import logger from '../config/logger';

// Create the Map (tokenId as key and expiration time as value)
const tokenBlacklist = new Map();

// Sync blacklisted tokens from DB to RAM
// Only sync in production/non-test environments
if (process.env.NODE_ENV !== 'test') {
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
}

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
// Don't start the interval during tests
if (process.env.NODE_ENV !== 'test') {
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
}

// Function to clear the interval (for cleanup during tests or shutdown)
function stopCleanupInterval() {
  if (blacklistTokenIntervalId) {
    clearInterval(blacklistTokenIntervalId);
    blacklistTokenIntervalId = null;
  }
}

// Export the Map and functions
export {
  tokenBlacklist,
  blacklistToken,
  isTokenBlacklisted,
  removeBlacklistedToken,
  blacklistTokenIntervalId,
  stopCleanupInterval,
};
