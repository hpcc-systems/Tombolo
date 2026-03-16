export const getUser = (): any | null => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'authToken',
  'secret',
  'apiKey',
  'api_key',
  'privateKey',
  'private_key',
];

const sanitizeUserForStorage = (user: any): any => {
  if (!user || typeof user !== 'object') return user;
  const safe = { ...user };
  for (const key of SENSITIVE_KEYS) {
    delete safe[key];
  }
  return safe;
};

export const setUser = (user: any): boolean => {
  try {
    const safeUser = sanitizeUserForStorage(typeof user === 'string' ? JSON.parse(user) : user);
    localStorage.setItem('user', JSON.stringify(safeUser));
    return true;
  } catch {
    return false;
  }
};
