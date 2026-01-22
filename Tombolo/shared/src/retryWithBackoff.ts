export interface RetryableError extends Error {
  noRetry?: boolean;
}

export interface Logger {
  warn: (message: string, ...args: any[]) => void;
}

/**
 * Retry function with exponential backoff
 * @param fn - Function to retry
 * @param logger - Logging output method
 * @param maxRetries - Maximum number of retries
 * @param delay - Initial delay in milliseconds
 * @returns Result of the function
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  logger?: Logger,
  maxRetries: number = 3,
  delay: number = 2000
): Promise<T> {
  // Maximum delay cap to prevent setTimeout overflow (max ~24.8 days = 2^31-1 ms)
  const MAX_DELAY = 60000; // Cap at 60 seconds

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const error = err as RetryableError;

      // Don't retry if error is marked as non-retryable
      if (error.noRetry) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate backoff with exponential delay, capped at MAX_DELAY
      const calculatedDelay = delay * Math.pow(2, attempt);
      const backoffDelay = Math.min(calculatedDelay, MAX_DELAY);

      if (logger) {
        logger.warn(
          `Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${backoffDelay}ms...`
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

  // This should never be reached due to the throw in the catch block
  throw new Error('Unexpected end of retry loop');
}

export { retryWithBackoff };
