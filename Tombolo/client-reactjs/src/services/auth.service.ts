import { apiClient } from '@/services/api';
import type { AxiosResponse } from 'axios';

const authService = {
  resetTempPassword: async (resetData: any): Promise<any> => {
    const response: AxiosResponse = await apiClient.post('/auth/resetTempPassword', resetData);
    return response.data;
  },

  verifyEmail: async (token: string): Promise<any> => {
    const response: AxiosResponse = await apiClient.post('/auth/verifyEmail', { token });
    return response.data;
  },

  resendVerificationCode: async (email: string): Promise<any> => {
    const response: AxiosResponse = await apiClient.post('/auth/resendVerificationCode', { email });
    return response.data;
  },

  handlePasswordResetRequest: async (email: string): Promise<any> => {
    const response: AxiosResponse = await apiClient.post('/auth/handlePasswordResetRequest', { email });
    return response.data;
  },

  validateResetToken: async (token: string): Promise<any> => {
    const response: AxiosResponse = await apiClient.post('/auth/validateResetToken', { token });
    return response.data;
  },

  resetPasswordWithToken: async (resetData: any): Promise<any> => {
    const response: AxiosResponse = await apiClient.post('/auth/resetPasswordWithToken', resetData);
    return response.data;
  },

  getUserDetailsWithVerificationCode: async (token: string): Promise<any> => {
    const response: AxiosResponse = await apiClient.get(`/auth/getUserDetailsWithVerificationCode/${token}`);
    return response.data;
  },

  getUserDetailsWithToken: async (token: string): Promise<any> => {
    const response: AxiosResponse = await apiClient.get(`/auth/getUserDetailsWithToken/${token}`);
    return response.data;
  },

  loginBasicUser: async (email: string, password: string, deviceInfo?: any): Promise<any> => {
    const response: AxiosResponse = await apiClient.post('/auth/loginBasicUser', {
      email,
      password,
      deviceInfo,
    });
    return response.data;
  },

  refreshToken: async (): Promise<any> => {
    const response: AxiosResponse = await apiClient.post('/auth/refreshToken');
    return response.data;
  },

  logoutBasicUser: async (): Promise<any> => {
    const response: AxiosResponse = await apiClient.post('/auth/logoutBasicUser');
    return response.data;
  },

  registerBasicUser: async (userData: any): Promise<any> => {
    const response: AxiosResponse = await apiClient.post('/auth/registerBasicUser', {
      ...userData,
      registrationMethod: 'traditional',
    });
    return response.data;
  },

  registerApplicationOwner: async (userData: any): Promise<any> => {
    const response: AxiosResponse = await apiClient.post('/auth/registerApplicationOwner', {
      ...userData,
      registrationMethod: 'traditional',
    });
    return response.data;
  },

  loginOrRegisterAzureUser: async (code: string): Promise<any> => {
    const response: AxiosResponse = await apiClient.post('/auth/loginOrRegisterAzureUser', { code });
    return response;
  },

  requestAccess: async (requestData: any): Promise<any> => {
    const response: AxiosResponse = await apiClient.post('/auth/requestAccess', requestData);
    return response.data;
  },
};

export default authService;
