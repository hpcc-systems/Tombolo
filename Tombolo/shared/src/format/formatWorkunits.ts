import { readableLabels } from '../constants/index.js';

const formatNumber = (n: number | string | null | undefined): string =>
  n == null || isNaN(Number(n)) ? '-' : Math.round(Number(n)).toLocaleString();

// Default seconds formatter: show seconds with 3 decimal places (e.g. 1.234s)
const formatSeconds = (s: number | string | null | undefined): string =>
  s == null || isNaN(Number(s)) ? '-' : `${Number(s).toFixed(3)}s`;

// Format duration as "Hh Mm" using whole numbers for hours/minutes
const formatDurationHm = (
  seconds: number | string | null | undefined
): string => {
  if (seconds == null || isNaN(Number(seconds))) return '-';
  const total = Math.max(0, Math.floor(Number(seconds)));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
};

// Format hours as a decimal number with 2 decimals (e.g. 1.23h)
const formatHours = (
  h: number | string | null | undefined,
  decimals = 2
): string =>
  h == null || isNaN(Number(h)) ? '-' : `${Number(h).toFixed(decimals)}h`;

const formatBytes = (bytes: number | string | null | undefined): string => {
  if (bytes == null || isNaN(Number(bytes))) return '-';
  let size = Number(bytes);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(2)} ${units[i]}`;
};

const formatPercentage = (p: number | string | null | undefined): string =>
  p == null || isNaN(Number(p)) ? '-' : `${Number(p).toFixed(2)}%`;

// Currency formatting: default 2 decimals
const formatCurrency = (
  n: number | string | null | undefined,
  decimals = 2
): string => {
  if (n == null || isNaN(Number(n))) return '-';
  const num = Number(n);
  try {
    const nf = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return nf.format(num);
  } catch (_e) {
    const sign = num < 0 ? '-' : '';
    const abs = Math.abs(num);
    return `${sign}$${abs.toFixed(decimals)}`;
  }
};

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

function renderAnyMetric(
  key: string,
  value: number | string | null | undefined
): string {
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

function normalizeLabel(
  label: string | null | undefined
): string | null | undefined {
  if (!label) return label;

  // Normalize: replace newlines, &apos;, and multiple spaces with a single space
  const normalized = label.replace(/&apos;|\s+/g, ' ').trim();
  const lower = normalized.toLowerCase();
  for (const prefix in readableLabels) {
    if (lower.startsWith(prefix)) {
      return readableLabels[prefix];
    }
  }
  return normalized;
}

export {
  formatNumber,
  formatSeconds,
  formatDurationHm,
  formatHours,
  formatCurrency,
  formatBytes,
  normalizeLabel,
  formatPercentage,
  parseWorkunitTimestamp,
  renderAnyMetric,
};
