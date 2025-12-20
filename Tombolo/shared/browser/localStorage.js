const loadLocalStorage = (key, defaultValue) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : defaultValue;
  } catch (err) {
    console.error('Failed to load value from local storage', err);
    return defaultValue;
  }
};
const saveLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save value to local storage', err);
  }
};

export {
  saveLocalStorage,
  loadLocalStorage
}