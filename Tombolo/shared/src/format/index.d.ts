/**
 * Format a number for workunit details
 * @param n - the number to format
 * @returns formatted number as a string
 * @throws Error If it fails to parse the number
 */
export function formatNumber(n: string): string;

/**
 * Format seconds for workunit details
 * @param s - the seconds to format
 * @returns formatted seconds as a string or '-'
 * @throws Error If it fails to parse the number
 */
export function formatSeconds(s: string | null): string;

/**
 * Format bytes for workunit details
 * @param bytes - the bytes to format
 * @returns formatted bytes as a string or '-'
 * @throws Error If it fails to parse the number
 */
export function formatBytes(bytes: string | null): string;

/**
 * Format percentage for workunit details
 * @param p - the percentage to format
 * @returns formatted percentage as a string or '-'
 * @throws Error If it fails to parse the number
 */
export function formatPercentage(p: string | null): string;

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
 * Truncates a string
 * @param str - The string you would like to be truncated
 * @param maxLength - Max length of the result string
 * @returns Truncated string
 * @throws Error
 */
export function truncateString(str: string, maxLength: number): string;

/**
 * Fast formatting for any workunit details metrics
 * @param key - Key of the property to render
 * @param value - Value of the property
 * @returns Formatted string
 * @throws Error
 */
export function renderAnyMetric(key: string, value: number): string;
