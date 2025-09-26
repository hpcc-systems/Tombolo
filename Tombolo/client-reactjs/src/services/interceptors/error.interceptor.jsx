import { notification } from 'antd';

export const errorInterceptor = (apiClient) => {
  const showErrorNotification = ({ message, description }) => {
    notification.error({
      duration: 8,
      showProgress: true,
      message,
      description,
      placement: 'topRight',
    });
  };

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { response, config } = error;

      // Handle network/connection errors (no response)
      if (!response) {
        try {
          const { store } = await import('@/redux/store/Store');
          const { setBackendStatus } = await import('@/redux/slices/BackendSlice');
          store.dispatch(setBackendStatus(false));
        } catch (importError) {
          console.error('Failed to update backend status:', importError);
        }
        return Promise.reject(error);
      }

      // Handle 401 - Failed to authenticate
      if (response.status === 401 && config.url !== '/auth/loginBasicUser') {
        const currentPath = window.location.pathname;
        const authRoutes = ['/login', '/register', '/reset-password', '/forgot-password', '/reset-temporary-password'];
        const isAuthRoute = authRoutes.some((route) => currentPath.startsWith(route));

        if (!isAuthRoute) {
          try {
            const { store } = await import('@/redux/store/Store');
            const { logout } = await import('@/redux/slices/AuthSlice');
            store.dispatch(logout());
            localStorage.setItem('sessionExpired', true);
            window.location.href = '/login';
          } catch (importError) {
            console.error('Failed to handle logout:', importError);
          }
        }
        return Promise.reject(error);
      }

      // Handle 403 - Permission denied
      if (response.status === 403) {
        showErrorNotification({ message: 'Permission denied' });
        return Promise.reject(error);
      }

      // Suppress error messages while retries are still happening
      const retryCfg = config?.['axios-retry'];
      if (retryCfg && retryCfg.retryCount < (retryCfg.retries || 0)) {
        return Promise.reject(error);
      }

      // Show error only once per request (even if retries exhausted)
      if (!config._errorShown) {
        config._errorShown = true; // mark this request as handled

        const errors = response?.data?.errors;

        if (Array.isArray(errors) && errors.length > 0) {
          showErrorNotification({
            message: response.data?.message,
            description: (
              <>
                {errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </>
            ),
          });
        } else if (response?.data?.message) {
          showErrorNotification({ message: response.data.message });
        } else if (response?.status >= 400) {
          showErrorNotification({ message: 'An error occurred' });
        }
      }

      return Promise.reject(error);
    }
  );
};
