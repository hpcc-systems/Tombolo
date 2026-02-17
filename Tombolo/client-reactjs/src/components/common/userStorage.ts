export const getUser = (): any | null => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setUser = (user: any): boolean => {
  try {
    if (typeof user === 'object') {
      user = JSON.stringify(user);
    }
    localStorage.setItem('user', user);
    return true;
  } catch {
    return false;
  }
};
