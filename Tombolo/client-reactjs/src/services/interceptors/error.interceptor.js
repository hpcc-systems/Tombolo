// interceptors/error.interceptor.js

export const errorInterceptor = (apiClient) => {
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { response, config } = error;

      // ---- Network / connection errors (no response at all) ----
      if (!response) {
        return Promise.reject({
          type: 'NETWORK_ERROR',
          status: null,
          messages: ['Unable to reach the server'],
          raw: null,
          originalError: error,
        });
      }

      // ---- 401 Unauthorized ----
      if (response.status === 401 && config.url !== '/auth/loginBasicUser') {
        return Promise.reject({
          type: 'AUTH_ERROR',
          status: 401,
          messages: ['Authentication required'],
          raw: response.data,
          originalError: error,
        });
      }

      // ---- 403 Forbidden ----
      if (response.status === 403) {
        return Promise.reject({
          type: 'FORBIDDEN',
          status: 403,
          messages: ['Permission denied'],
          raw: response.data,
          originalError: error,
        });
      }

      // ---- Normalize backend error body ----
      const data = response?.data || {};
      let messages = ['An error occurred'];

     if (Array.isArray(data.messages) && data.messages.length > 0) {
        messages = data.messages; // Prefer 'messages' array first
      } else if (typeof data.message === 'string' && data.message.trim() !== '') {
        messages = [data.message]; // Fallback to 'message' if present

      return Promise.reject({
        type: 'API_ERROR',
        status: response.status,
        messages,
        raw: data,
        originalError: error,
      });
    }
  );
};
