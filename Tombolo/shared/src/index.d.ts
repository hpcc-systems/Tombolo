/**
 * @tombolo/shared
 *
 * Universal utilities that work in both browser and Node.js
 * For backend-only utilities, use '@tombolo/shared/backend'
 */

/**
 * Options for retry with backoff
 */
export interface RetryLogger {
  warn(message: string): void;
}

/**
 * Retry a function with exponential backoff
 * @param fn - Async function to retry
 * @param logger - Optional logger with warn method
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delay - Initial delay in milliseconds (default: 2000)
 * @returns Result of the function
 * @throws Error from the function if all retries fail
 */
export function retryWithBackoff<T>(
  fn: () => Promise<T>,
  logger?: RetryLogger,
  maxRetries?: number,
  delay?: number
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

export * from './format/index.d.ts';

export * from './constants/index.d.ts';
