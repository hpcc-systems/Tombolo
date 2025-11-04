import { apiClient } from '@/services/api';

const authService = {
  // Reset temporary password - OWNER REGISTRATION
  resetTempPassword: async (resetData) => {
    const response = await apiClient.post('/auth/resetTempPassword', resetData);
    return response.data;
  },

  // Verify email with token
  verifyEmail: async (token) => {
    const response = await apiClient.post('/auth/verifyEmail', { token });
    return response.data;
  },

  // Resend verification code
  resendVerificationCode: async (email) => {
    const response = await apiClient.post('/auth/resendVerificationCode', { email });
    return response.data;
  },

  // Request password reset
  handlePasswordResetRequest: async (email) => {
    const response = await apiClient.post('/auth/handlePasswordResetRequest', { email });
    return response.data;
  },

  // Validate reset token and get user details
  validateResetToken: async (token) => {
    const response = await apiClient.post('/auth/validateResetToken', { token });
    return response.data;
  },

  // Reset password with token
  resetPasswordWithToken: async (resetData) => {
    const response = await apiClient.post('/auth/resetPasswordWithToken', resetData);
    return response.data;
  },

  // Get user details with verification code
  getUserDetailsWithVerificationCode: async (token) => {
    const response = await apiClient.get(`/auth/getUserDetailsWithVerificationCode/${token}`);
    return response.data;
  },

  // Get user details with token
  getUserDetailsWithToken: async (token) => {
    const response = await apiClient.get(`/auth/getUserDetailsWithToken/${token}`);
    return response.data;
  },

  // Login basic user
  loginBasicUser: async (email, password, deviceInfo) => {
    const response = await apiClient.post('/auth/loginBasicUser', {
      email,
      password,
      deviceInfo,
    });
    return response.data;
  },

  // Logout basic user
  logoutBasicUser: async () => {
    const response = await apiClient.post('/auth/logoutBasicUser');
    return response.data;
  },

  // Register basic user
  registerBasicUser: async (userData) => {
    const response = await apiClient.post('/auth/registerBasicUser', {
      ...userData,
      registrationMethod: 'traditional',
    });
    return response.data;
  },

  // Register application owner
  registerApplicationOwner: async (userData) => {
    const response = await apiClient.post('/auth/registerApplicationOwner', {
      ...userData,
      registrationMethod: 'traditional',
    });
    return response.data;
  },

  // Login or register Azure user
  loginOrRegisterAzureUser: async (code) => {
    const response = await apiClient.post('/auth/loginOrRegisterAzureUser', { code });
    return response;
  },

  // Request access for user without roles/applications
  requestAccess: async (requestData) => {
    const response = await apiClient.post('/auth/requestAccess', requestData);
    return response.data;
  },
};

export default authService;
