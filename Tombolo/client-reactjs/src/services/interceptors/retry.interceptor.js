// interceptors/retry.interceptor.js
export const retryInterceptor = (apiClient) => {
  // Request logging
  apiClient.interceptors.request.use(
    (config) => {
      console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`);
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
      console.log(`[Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
      return response;
    },
    (error) => {
      const config = error.config || {};
      console.error(`[Response Error] ${config.method?.toUpperCase()} ${config.url} - ${error.message}`);
      return Promise.reject(error);
    }
  );
};
