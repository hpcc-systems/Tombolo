/**
 * Polyfills for __dirname and __filename in ESM
 *
 * In CommonJS: __dirname and __filename are automatically available
 * In ESM: We need to derive them from import.meta.url
 *
 * Usage:
 *   import { __dirname, __filename, getDirname, getFilename } from './utils/polyfills.js';
 *
 * Or inline:
 *   import { fileURLToPath } from 'url';
 *   import { dirname } from 'path';
 *   const __filename = fileURLToPath(import.meta.url);
 *   const __dirname = dirname(__filename);
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * Get __filename equivalent from import.meta.url
 * @param {string} importMetaUrl - import.meta.url from calling module
 * @returns {string} Absolute file path
 */
export function getFilename(importMetaUrl) {
  return fileURLToPath(importMetaUrl);
}

/**
 * Get __dirname equivalent from import.meta.url
 * @param {string} importMetaUrl - import.meta.url from calling module
 * @returns {string} Absolute directory path
 */
export function getDirname(importMetaUrl) {
  return dirname(fileURLToPath(importMetaUrl));
}

// Convenience exports for direct use (less flexible but cleaner)
// Note: These won't work correctly - they'll give you the polyfills.js directory
// Use the functions above instead!
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
