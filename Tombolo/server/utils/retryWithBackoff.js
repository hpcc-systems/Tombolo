const logger = require('../config/logger');

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 3, delay = 2000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      // Don't retry if error is marked as non-retryable
      if (err.noRetry) {
        throw err;
      }

      if (attempt === maxRetries) {
        throw err;
      }

      const backoffDelay = delay * Math.pow(2, attempt);
      logger.warn(
        `Attempt ${attempt + 1} failed: ${err.message}. Retrying in ${backoffDelay}ms...`
      );

      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}

module.exports = retryWithBackoff;
