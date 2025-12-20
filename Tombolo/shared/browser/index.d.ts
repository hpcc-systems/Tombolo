/**
 * Loads a key from local storage
 * @param key - Local storage key to retrieve
 * @param defaultValue - default value in case of failure to retrieve
 * @returns defaultValue or retrieved value from local storage
 * @throws Error
 */
export function loadLocalStorage(key: string, defaultValue: string): string;

/**
 * Sets a key in local storage
 * @param key - Local storage key to save
 * @param value - default value in case of failure to retrieve
 * @returns value or retrieved value from local storage
 * @throws Error
 */
export function saveLocalStorage(key: string, value: string): string;