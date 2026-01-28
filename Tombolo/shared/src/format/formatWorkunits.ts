const formatNumber = (n: any): string =>
  n == null ? '-' : Number(n).toLocaleString();

const formatSeconds = (s: any): string =>
  s == null || isNaN(s) ? '-' : `${Number(s).toFixed(3)}s`;

const formatBytes = (bytes: any): string => {
  if (bytes == null || isNaN(bytes)) return '-';
  let size = Number(bytes);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(2)} ${units[i]}`;
};

const formatPercentage = (p: any): string =>
  p == null ? '-' : `${Number(p).toFixed(2)}%`;

/**
 * Parses workunit timestamp from wuId and applies timezone offset
 * @param wuId - The workunit ID
 * @param timezoneOffset - Timezone offset in minutes
 * @returns Parsed and adjusted timestamp
 */
function parseWorkunitTimestamp(
  wuId: string,
  timezoneOffset: number = 0
): Date {
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

function renderAnyMetric(key: string, value: any): string {
  const lower = String(key).toLowerCase();
  if (
    lower.includes('time') ||
    lower.includes('elapsed') ||
    lower.includes('execute')
  )
    return formatSeconds(value);
  if (lower.startsWith('num') || lower.includes('count'))
    return formatNumber(value);
  if (
    lower.includes('size') ||
    lower.includes('disk') ||
    lower.includes('memory')
  )
    return formatBytes(value);
  return String(value);
}

export {
  formatNumber,
  formatSeconds,
  formatBytes,
  formatPercentage,
  parseWorkunitTimestamp,
  renderAnyMetric,
};
