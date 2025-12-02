/**
 * Parses workunit timestamp from wuId and applies timezone offset
 * @param {string} wuId - The workunit ID
 * @param {number} timezoneOffset - Timezone offset in minutes
 * @returns {Date} Parsed and adjusted timestamp
 */

function parseWorkunitTimestamp(wuId, timezoneOffset = 0) {
  // Handle workunit ID format: W[YYYYMMDD]-[HHMMSS]-[SEQUENCE]
  // Extract just the date/time part, ignoring the sequence number
  const wuIdMatch = wuId.match(/^W(\d{8})-(\d{6})-?\d*$/);

  if (!wuIdMatch) {
    throw new Error(`Invalid WUID format: ${wuId}`);
  }

  const [, dateStr, timeStr] = wuIdMatch;

  // Parse date: YYYYMMDD
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
  const day = parseInt(dateStr.substring(6, 8));

  // Parse time: HHMMSS
  const hour = parseInt(timeStr.substring(0, 2));
  const minute = parseInt(timeStr.substring(2, 4));
  const second = parseInt(timeStr.substring(4, 6));

  // Create timestamp
  let timestamp = new Date(year, month, day, hour, minute, second);

  // Apply timezone offset if not 0
  if (timezoneOffset !== 0) {
    timestamp = new Date(timestamp.getTime() + timezoneOffset * 60 * 1000);
  }

  return timestamp;
}

export default parseWorkunitTimestamp;
