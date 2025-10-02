import { getRoleNameArray } from '@/components/common/AuthUtil';

const csrfHeaderName = 'x-csrf-token';

// Define authHeader
export function authHeader() {
  let csrfToken = document.cookie.split(';').find((cookie) => cookie.trim().startsWith(csrfHeaderName + '='));
  if (csrfToken) {
    csrfToken = csrfToken.split('=')[1].split('%')[0];
    return { Accept: 'application/json', 'Content-Type': 'application/json', [csrfHeaderName]: csrfToken };
  }
  return { Accept: 'application/json', 'Content-Type': 'application/json' };
}

const checkPermissions = (resource, config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const isLogout = resource.includes('/api/auth/logout');
  if (isLogout) return true;

  if (!user) {
    const permittedResourcesWithoutUser = ['/api/status', '/api/auth', '/api/wizard'];
    return permittedResourcesWithoutUser.some((perm) => resource.startsWith(perm));
  }

  let method = config.method?.toUpperCase() || 'GET';
  const userRoles = getRoleNameArray();
  const allowedRoutesForReaders = [`/api/user/${user.id}`];

  if (
    userRoles.length === 1 &&
    userRoles.includes('reader') &&
    method !== 'GET' &&
    !allowedRoutesForReaders.some((route) => resource.startsWith(route))
  ) {
    return false;
  }
  return true;
};

export const authInterceptor = (apiClient) => {
  apiClient.interceptors.request.use(
    (config) => {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: config.baseURL + config.url,
      });

      if (!checkPermissions(config.url, config)) {
        return Promise.reject({
          type: 'PERMISSION_DENIED',
          message: 'You do not have permission to perform this action',
        });
      }

      const headers = authHeader();
      config.headers = { ...config.headers, ...headers };
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { response, config } = error;
      if (response?.status === 401 && config.url !== '/auth/loginBasicUser') {
        // TODO - handle unauthorized user, Token refresh, logging out , clearing local storage  etc
      }
      return Promise.reject(error);
    }
  );
};
