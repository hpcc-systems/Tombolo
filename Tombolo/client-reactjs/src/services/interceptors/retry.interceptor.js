export const retryInterceptor = (apiClient) => {
  // Request interceptor - add retry metadata
  apiClient.interceptors.request.use(
    (config) => {
      // Add timestamp for retry tracking
      config.metadata = {
        startTime: Date.now(),
        retryCount: config['axios-retry']?.retryCount || 0,
      };
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  apiClient.interceptors.response.use(
    (response) => {
      // success after retry
      return response;
    },
    (error) => {
      // error after retry
      return Promise.reject(error);
    }
  );
};
