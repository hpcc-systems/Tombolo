import type { AxiosInstance, AxiosResponse } from 'axios';

export const dataExtractorInterceptor = (apiClient: AxiosInstance): void => {
  apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
      if (response?.data?.success) {
        response.data = response.data.data;
      }
      return response;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );
};
