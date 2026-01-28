/**
 * Load a value from localStorage with type-safe defaults
 * @param key - The localStorage key
 * @param defaultValue - The default value if key doesn't exist or parsing fails
 * @returns The parsed value or defaultValue
 */
const loadLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : defaultValue;
  } catch (err) {
    console.error('Failed to load value from local storage', err);
    return defaultValue;
  }
};

/**
 * Save a value to localStorage
 * @param key - The localStorage key
 * @param value - The value to save (will be JSON stringified)
 */
const saveLocalStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save value to local storage', err);
  }
};

export { saveLocalStorage, loadLocalStorage };
