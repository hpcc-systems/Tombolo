module.exports = async () => {
  // Clean up any open handles from tokenBlackListing
  const { stopCleanupInterval } = require('../utils/tokenBlackListing');
  stopCleanupInterval();
};
