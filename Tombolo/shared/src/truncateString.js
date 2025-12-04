/**
 * Truncates a string to a maximum length, keeping the start and end with ellipsis in the middle
 * Also removes whitespace and newlines
 * @param {string} str - The string to truncate
 * @param {number} maxLength - Maximum length (default: 245)
 * @returns {string|null} Truncated string or null if input is null
 */
function truncateString(str, maxLength = 245) {
  if (!str) return null;

  const newStr = str.replace(/\s+/g, ' ').trim();
  if (newStr.length <= maxLength) return newStr;

  // Keep roughly equal parts from start and end
  const ellipsis = '...';
  const charsToKeep = maxLength - ellipsis.length;
  const startChars = Math.ceil(charsToKeep / 2);
  const endChars = Math.floor(charsToKeep / 2);

  return newStr.slice(0, startChars) + ellipsis + newStr.slice(-endChars);
}

export default truncateString;
