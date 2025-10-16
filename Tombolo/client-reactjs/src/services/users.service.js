import { apiClient } from '@/services/api';

const usersService = {
  // Create a new user
  create: async (userData) => {
    const response = await apiClient.post('/user', userData);
    return response.data;
  },

  // Get all users
  getAll: async () => {
    const response = await apiClient.get('/user');
    return response.data;
  },

  // Update a user
  update: async ({ userId, userData }) => {
    const response = await apiClient.patch(`/user/${userId}`, userData);
    return response.data;
  },

  // Delete a user by ID
  delete: async ({ id }) => {
    const response = await apiClient.delete(`/user/${id}`);
    return response.data;
  },

  // Update user roles
  updateRoles: async ({ userId, roles }) => {
    const response = await apiClient.patch(`/user/roles/update/${userId}`, { roles });
    return response.data;
  },

  // Update user applications
  updateApplications: async ({ userId, applications }) => {
    const response = await apiClient.patch(`/user/applications/${userId}`, { applications });
    return response.data;
  },

  // Bulk delete users
  bulkDelete: async ({ ids }) => {
    const response = await apiClient.delete('/user/bulk-delete', {
      data: { ids },
    });
    return response.data;
  },

  // Reset user password
  resetPassword: async ({ id }) => {
    const response = await apiClient.post('/user/reset-password-for-user', { id });
    return response.data;
  },

  // Unlock user account
  unlockAccount: async ({ id }) => {
    const response = await apiClient.post('/user/unlock-account', { id });
    return response.data;
  },
};

export default usersService;
