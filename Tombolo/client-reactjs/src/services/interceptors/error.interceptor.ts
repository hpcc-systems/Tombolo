import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

const ignore401Routes = ['/auth/loginBasicUser', '/auth/resetTempPassword'];

interface NormalizedError {
  type: 'NETWORK_ERROR' | 'AUTH_ERROR' | 'FORBIDDEN' | 'API_ERROR';
  status: number | null;
  messages: string[];
  raw: any;
  originalError: AxiosError;
}

export const errorInterceptor = (apiClient: AxiosInstance): void => {
  apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const { response, config } = error;

      if (!response) {
        return Promise.reject({
          type: 'NETWORK_ERROR',
          status: null,
          messages: ['Unable to reach the server'],
          raw: null,
          originalError: error,
        } as NormalizedError);
      }

      if (response.status === 401 && !ignore401Routes.includes(config?.url || '')) {
        return Promise.reject({
          type: 'AUTH_ERROR',
          status: 401,
          messages: ['Authentication required'],
          raw: response.data,
          originalError: error,
        } as NormalizedError);
      }

      if (response.status === 403) {
        return Promise.reject({
          type: 'FORBIDDEN',
          status: 403,
          messages: ['Permission denied'],
          raw: response.data,
          originalError: error,
        } as NormalizedError);
      }

      const data = (response?.data as any) || {};
      let messages = ['An error occurred'];

      if (Array.isArray(data.errors) && data.errors.length > 0) {
        messages = data.errors;
      } else if (typeof data.message === 'string' && data.message.trim() !== '') {
        messages = [data.message];
      } else if (Array.isArray(data.messages) && data.messages.length > 0) {
        messages = data.messages;
      }

      return Promise.reject({
        type: 'API_ERROR',
        status: response.status,
        messages,
        raw: data,
        originalError: error,
      } as NormalizedError);
    }
  );
};
