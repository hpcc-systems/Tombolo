/**
 * Checks if a string is empty
 * Also removes whitespace and newlines
 * @param {string} str - The string to check
 * @returns {string|null} Cleaned string or null
 */
function ifEmptyNull(str) {
  if (!str) return null;
  const newStr = str.replace(/\s+/g, ' ').trim();
  if (newStr === '') return null;
  return newStr;
}

/**
 * Checks if a string is empty
 * Also removes whitespace and newlines
 * @param {string} str - The string to check
 * @returns {string|undefined} Cleaned string or undefined
 */
function ifEmptyUndef(str) {
  if (!str) return undefined;
  const newStr = str.replace(/\s+/g, ' ').trim();
  if (newStr === '') return undefined;
  return newStr;
}

export { ifEmptyNull, ifEmptyUndef };
