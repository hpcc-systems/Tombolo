/**
 * Checks if a string is empty
 * Also removes whitespace and newlines
 * @param str - The string to check
 * @returns Cleaned string or null
 */
function ifEmptyNull(str: string | null | undefined): string | null {
  if (!str) return null;
  const newStr = str.replace(/\s+/g, ' ').trim();
  if (newStr === '') return null;
  return newStr;
}

/**
 * Checks if a string is empty
 * Also removes whitespace and newlines
 * @param str - The string to check
 * @returns Cleaned string or undefined
 */
function ifEmptyUndef(str: string | null | undefined): string | undefined {
  if (!str) return undefined;
  const newStr = str.replace(/\s+/g, ' ').trim();
  if (newStr === '') return undefined;
  return newStr;
}

export { ifEmptyNull, ifEmptyUndef };
