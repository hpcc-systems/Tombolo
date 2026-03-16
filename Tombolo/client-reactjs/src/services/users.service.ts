import { apiClient } from '@/services/api';
import type { UserDTO } from '@tombolo/shared';

const usersService = {
  create: async (userData: Partial<UserDTO>): Promise<UserDTO> => {
    const response = await apiClient.post('/user', userData);
    return response.data;
  },

  getAll: async (): Promise<UserDTO[]> => {
    const response = await apiClient.get('/user');
    return response.data;
  },

  getOne: async ({ id }: { id: string }): Promise<UserDTO> => {
    const response = await apiClient.get(`/user/${id}`);
    return response.data;
  },

  update: async ({ userId, userData }: { userId: string; userData: Partial<UserDTO> }): Promise<UserDTO> => {
    const response = await apiClient.patch(`/user/${userId}`, userData);
    return response.data;
  },

  delete: async ({ id }: { id: string }): Promise<void> => {
    const response = await apiClient.delete(`/user/${id}`);
    return response.data;
  },

  updateRoles: async ({ userId, roles }: { userId: string; roles: any[] }): Promise<any> => {
    const response = await apiClient.patch(`/user/roles/update/${userId}`, { roles });
    return response.data;
  },

  updateApplications: async ({ userId, applications }: { userId: string; applications: any[] }): Promise<any> => {
    const response = await apiClient.patch(`/user/applications/${userId}`, { applications });
    return response.data;
  },

  bulkDelete: async ({ ids }: { ids: string[] }): Promise<any> => {
    const response = await apiClient.delete('/user/bulk-delete', {
      data: { ids },
    });
    return response.data;
  },

  resetPassword: async ({ id }: { id: string }): Promise<any> => {
    const response = await apiClient.post('/user/reset-password-for-user', { id });
    return response.data;
  },

  unlockAccount: async ({ id }: { id: string }): Promise<any> => {
    const response = await apiClient.post('/user/unlock-account', { id });
    return response.data;
  },

  changePassword: async ({ id, values }: { id: string; values: any }): Promise<any> => {
    const response = await apiClient.patch(`/user/change-password/${id}`, values);
    return response.data;
  },

  updateUserInfo: async ({ id, values }: { id: string; values: any }): Promise<any> => {
    const response = await apiClient.patch(`/user/update/${id}`, values);
    return response.data;
  },

  changePasswordAlt: async ({ id, values }: { id: string; values: any }): Promise<any> => {
    const response = await apiClient.patch(`/user/changepassword/${id}`, values);
    return response.data;
  },
};

export default usersService;
