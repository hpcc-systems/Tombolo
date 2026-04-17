/**
 * Truncates a string to a maximum length, keeping the start and end with ellipsis in the middle
 * Also removes whitespace and newlines
 * @param str - The string to truncate
 * @param maxLength - Maximum length (default: 255)
 * @param mode - Truncation mode: 'middle' keeps start/end with ellipsis in the middle,
 * 'end' keeps the start and appends ellipsis at the end
 * @returns Truncated string or null if input is null
 */
function truncateString(
  str: string | null | undefined,
  maxLength: number = 255,
  mode: 'middle' | 'end' = 'middle'
): string | null {
  if (!str) return null;

  const newStr = str.replace(/\s+/g, ' ').trim();
  if (newStr.length <= maxLength) return newStr;

  const ellipsis = '...';
  if (maxLength <= ellipsis.length) {
    return ellipsis.slice(0, maxLength);
  }

  const charsToKeep = maxLength - ellipsis.length;

  if (mode === 'end') {
    return newStr.slice(0, charsToKeep) + ellipsis;
  }

  // Keep roughly equal parts from start and end
  const startChars = Math.ceil(charsToKeep / 2);
  const endChars = Math.floor(charsToKeep / 2);

  return newStr.slice(0, startChars) + ellipsis + newStr.slice(-endChars);
}

export { truncateString };
