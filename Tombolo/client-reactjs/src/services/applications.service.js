import { apiClient } from '@/services/api';

const applicationsService = {
  getAll: async () => {
    const response = await apiClient.get('/app/read/app_list');
    return response.data;
  },

  save: async (applicationData) => {
    const response = await apiClient.post('/app/read/saveApplication', applicationData);
    return response.data;
  },

  delete: async ({ appIdToDelete, userId }) => {
    const response = await apiClient.post('/app/read/deleteApplication', {
      appIdToDelete,
      user: userId,
    });
    return response.data;
  },
};

export default applicationsService;
