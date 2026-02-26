import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export const retryInterceptor = (apiClient: AxiosInstance): void => {
  apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      return config;
    },
    (error: AxiosError) => {
      console.error('[Request Error]', error);
      return Promise.reject(error);
    }
  );

  apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig | undefined;
      console.error(`[Response Error] ${config?.method?.toUpperCase()} ${config?.url} - ${error.message}`);
      return Promise.reject(error);
    }
  );
};
