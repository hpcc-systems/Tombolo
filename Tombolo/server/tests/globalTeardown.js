export default async () => {
  // Clean up any open handles from tokenBlackListing
  const { stopCleanupInterval } = await import('../utils/tokenBlackListing.js');
  stopCleanupInterval();
};
