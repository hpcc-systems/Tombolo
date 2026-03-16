import authService from '@/services/auth.service';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];
let isLoggedOut = false;

const processQueue = (error: any, token: string | null = null): void => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

export const resetAuthState = (): void => {
  isLoggedOut = false;
  isRefreshing = false;
  failedQueue = [];
};

export const authInterceptor = (axiosInstance: AxiosInstance): void => {
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
        const csrfCookie = document.cookie.split(';').find(c => c.trim().startsWith('x-csrf-token='));

        if (csrfCookie) {
          const cookieValue = csrfCookie.split('=')[1];
          const decodedValue = decodeURIComponent(cookieValue);
          const secretToken = decodedValue.split('|')[0];

          if (secretToken) {
            config.headers['x-csrf-token'] = secretToken;
          }
        }
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/loginBasicUser') &&
        !originalRequest.url?.includes('/auth/resetTempPassword') &&
        !originalRequest.url?.includes('/auth/refreshToken') &&
        !isLoggedOut
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              return axiosInstance(originalRequest);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await authService.refreshToken();
          processQueue(null);
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isLoggedOut = true;
          localStorage.removeItem('user');

          const { store } = await import('@/redux/store/Store');
          const { logout } = await import('@/redux/slices/AuthSlice');

          store.dispatch(logout());
          window.location.replace('/login');

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      if (error.response?.status === 401 && isLoggedOut) {
        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );
};
