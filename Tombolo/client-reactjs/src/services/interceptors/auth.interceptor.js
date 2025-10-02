export const authInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      // TODO- Token refresh logic will be implemented here after axios migration is complete
      return config;
    },
    (error) => Promise.reject(error)
  );
};
