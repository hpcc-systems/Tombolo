/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {any} logger - Logging output method
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} Result of the function
 */
async function retryWithBackoff(fn, logger, maxRetries = 3, delay = 2000) {
  // Maximum delay cap to prevent setTimeout overflow (max ~24.8 days = 2^31-1 ms)
  const MAX_DELAY = 60000; // Cap at 60 seconds

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

      // Calculate backoff with exponential delay, capped at MAX_DELAY
      const calculatedDelay = delay * Math.pow(2, attempt);
      const backoffDelay = Math.min(calculatedDelay, MAX_DELAY);

      if (logger) {
        logger.warn(
          `Attempt ${attempt + 1} failed: ${err.message}. Retrying in ${backoffDelay}ms...`
        );
      }

      // Use setImmediate as fallback if timer queue is full
      // This prevents RangeError: Invalid array length when timer queue overflows
      try {
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      } catch {
        if (logger) {
          logger.warn('Timer queue full, using setImmediate for retry delay');
        }
        // Yield to event loop multiple times to simulate delay
        const yieldsNeeded = Math.ceil(backoffDelay / 100);
        for (let i = 0; i < Math.min(yieldsNeeded, 10); i++) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }
    }
  }
}
module.exports = retryWithBackoff;
