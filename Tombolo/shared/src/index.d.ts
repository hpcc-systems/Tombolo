/**
 * @tombolo/shared
 *
 * Universal utilities that work in both browser and Node.js
 * For backend-only utilities, use '@tombolo/shared/backend'
 */

/**
 * Parses workunit timestamp from wuId and applies timezone offset
 * @param wuId - The workunit ID (format: W[YYYYMMDD]-[HHMMSS]-[SEQUENCE])
 * @param timezoneOffset - Timezone offset in minutes (default: 0)
 * @returns Parsed and adjusted timestamp
 * @throws Error if WUID format is invalid
 */
export function parseWorkunitTimestamp(
  wuId: string,
  timezoneOffset?: number
): Date;

/**
 * Options for retry with backoff
 */
export interface RetryLogger {
  warn(message: string): void;
}

/**
 * Retry a function with exponential backoff
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delay - Initial delay in milliseconds (default: 2000)
 * @param logger - Optional logger with warn method
 * @returns Result of the function
 * @throws Error from the function if all retries fail
 */
export function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries?: number,
  delay?: number,
  logger?: RetryLogger
): Promise<T>;

/**
 * Decrypts a string using `crypto`
 * @param text - The string you would like to be decrypted
 * @param encryptionKey - Encryption key
 * @returns Decrypted string
 * @throws Error if encryptionKey isn't set
 */
export function decryptString(text: string, encryptionKey: string): string;

/**
 * Encrypts a string using `crypto`
 * @param text - The string you would like to be encrypted
 * @param encryptionKey - Encryption key
 * @returns Encrypted string
 * @throws Error if encryptionKey isn't set
 */
export function encryptString(text: string, encryptionKey: string): string;

/**
 * Truncates a string
 * @param str - The string you would like to be truncated
 * @param maxLength - Max length of the result string
 * @returns Truncated string
 * @throws Error
 */
export function truncateString(str: string, maxLength: number): string;
