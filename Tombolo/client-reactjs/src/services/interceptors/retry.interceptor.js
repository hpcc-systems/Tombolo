// interceptors/retry.interceptor.js
export const retryInterceptor = (apiClient) => {
  // Request logging
  apiClient.interceptors.request.use(
    (config) => {
      // Request logging handled by development tools
      return config;
    },
    (error) => {
      console.error('[Request Error]', error);
      return Promise.reject(error);
    }
  );

  // Response logging
  apiClient.interceptors.response.use(
    (response) => {
      // Response logging handled by development tools
      return response;
    },
    (error) => {
      const config = error.config || {};
      console.error(`[Response Error] ${config.method?.toUpperCase()} ${config.url} - ${error.message}`);
      return Promise.reject(error);
    }
  );
};
