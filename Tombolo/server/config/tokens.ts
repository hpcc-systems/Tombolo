// Token expiry durations
export const ACCESS_TOKEN_EXPIRY = '15m' as const;
export const REFRESH_TOKEN_EXPIRY = '7d' as const;

// Cookie settings
export const TOKEN_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days in milliseconds
