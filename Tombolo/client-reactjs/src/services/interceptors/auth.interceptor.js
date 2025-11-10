import authService from '@/services/auth.service';

let isRefreshing = false;
let failedQueue = [];
let isLoggedOut = false;

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Reset the logged out state when user logs in
export const resetAuthState = () => {
  isLoggedOut = false;
  isRefreshing = false;
  failedQueue = [];
};

export const authInterceptor = (axiosInstance) => {
  // Request interceptor - Add CSRF token to headers for state-changing methods
  axiosInstance.interceptors.request.use(
    (config) => {
      // For POST, PUT, DELETE requests, extract CSRF token from cookie
      if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
        // Extract CSRF token from cookie format: "secretToken|hashToken"
        const csrfCookie = document.cookie.split(';').find((c) => c.trim().startsWith('x-csrf-token='));

        if (csrfCookie) {
          const cookieValue = csrfCookie.split('=')[1];
          // Decode URL encoding and extract the secret token (first part before |)
          const decodedValue = decodeURIComponent(cookieValue);
          const secretToken = decodedValue.split('|')[0];

          if (secretToken) {
            config.headers['x-csrf-token'] = secretToken;
          }
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - Handle 401s and refresh tokens
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Check if it's a 401 error and not already a retry and not an ignored route
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url.includes('/auth/loginBasicUser') &&
        !originalRequest.url.includes('/auth/refreshToken') &&
        !isLoggedOut // Don't try to refresh if already logged out
      ) {
        // If already refreshing, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              return axiosInstance(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Call refresh endpoint through service layer
          await authService.refreshToken();

          // Process queued requests
          processQueue(null);

          // Retry original request
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed - logout user
          processQueue(refreshError, null);

          // Set logout flag to prevent further refresh attempts
          isLoggedOut = true;

          // Clear only auth-related storage
          localStorage.removeItem('user');

          // Import store dynamically to avoid circular dependency
          const { store } = await import('@/redux/store/Store');
          const { logout } = await import('@/redux/slices/AuthSlice');

          store.dispatch(logout());

          // Use replace instead of assign to prevent history issues
          window.location.replace('/login');

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // If we're logged out and get a 401, just reject without trying to refresh
      if (error.response?.status === 401 && isLoggedOut) {
        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );
};
