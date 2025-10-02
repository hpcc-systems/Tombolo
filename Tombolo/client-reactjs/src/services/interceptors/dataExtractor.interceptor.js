export const dataExtractorInterceptor = (apiClient) => {
  apiClient.interceptors.response.use(
    (response) => {
      // Unwrap the backend's nested data if successful
      if (response?.data?.success) {
        response.data = response.data.data; // Override to return just the payload
      }
      return response;
    },
    (error) => {
      // Pass errors to errorInterceptor
      return Promise.reject(error);
    }
  );
};
