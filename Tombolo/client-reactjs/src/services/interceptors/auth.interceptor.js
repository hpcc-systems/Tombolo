import { getRoleNameArray } from '@/components/common/AuthUtil';

// Constants for permitted resources and CSRF header
const CSRF_HEADER_NAME = 'x-csrf-token';
const PERMITTED_RESOURCES_WITHOUT_USER = ['/api/status', '/api/auth', '/api/wizard'];
const ALLOWED_ROUTES_FOR_READERS = (userId) => [`/api/user/${userId}`];

/**
 * Extracts CSRF token from cookies.
 * @param {string} headerName - The name of the CSRF header.
 * @returns {string|null} - The CSRF token or null if not found.
 */
const getCsrfToken = (headerName) => {
  const cookie = document.cookie.split(';').find((cookie) => cookie.trim().startsWith(`${headerName}=`));
  return cookie ? cookie.split('=')[1].split('%')[0] : null;
};

/**
 * Checks if the user has permission to access the requested resource.
 * @param {string} resource - The URL of the requested resource.
 * @param {Object} config - The API request configuration.
 * @returns {boolean} - True if access is allowed, false otherwise.
 */
const checkPermissions = (resource, config) => {
  // Allow logout calls
  if (resource?.includes('/api/auth/logout')) {
    return true;
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Check permitted resources without user
  if (!user?.id) {
    return PERMITTED_RESOURCES_WITHOUT_USER.some((permitted) => resource?.startsWith(permitted));
  }

  // Determine HTTP method
  const method = (config?.headers?.method || config?.method || 'GET').toUpperCase();

  // Get user roles and allowed routes for readers
  const userRoles = getRoleNameArray();
  const allowedRoutes = ALLOWED_ROUTES_FOR_READERS(user.id);

  // Check if route is allowed for readers
  const isAllowedRoute = allowedRoutes.some((route) => resource?.startsWith(route));

  // Restrict readers to GET requests for non-allowed routes
  if (userRoles.length === 1 && userRoles.includes('reader') && method !== 'GET' && !isAllowedRoute) {
    return false;
  }

  return true;
};

/**
 * Configures an Axios interceptor to handle authentication and permissions.
 * @param {Object} apiClient - The Axios instance to configure.
 */
export const authInterceptor = (apiClient) => {
  apiClient.interceptors.request.use(
    (config) => {
      // Add CSRF token to headers
      const csrfToken = getCsrfToken(CSRF_HEADER_NAME);
      if (csrfToken) {
        config.headers[CSRF_HEADER_NAME] = csrfToken;
      }

      // Validate permissions
      const isAllowed = checkPermissions(config.url, config);
      if (!isAllowed) {
        return Promise.reject(new Error('Permission denied'));
      }

      return config;
    },
    (error) => Promise.reject(error)
  );
};
