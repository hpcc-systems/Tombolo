const csrfHeaderName = 'x-csrf-token';

export function authHeader(): Record<string, string> {
  let csrfToken = document.cookie.split(';').find(cookie => cookie.trim().startsWith(csrfHeaderName + '='));

  if (csrfToken) {
    csrfToken = csrfToken.split('=')[1].split('%')[0];
    return { Accept: 'application/json', 'Content-Type': 'application/json', [csrfHeaderName]: csrfToken } as Record<
      string,
      string
    >;
  }
  return { Accept: 'application/json', 'Content-Type': 'application/json' } as Record<string, string>;
}
