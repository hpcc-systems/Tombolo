import { apiClient } from '@/services/api';

const instanceSettingsService = {
  getAll: async () => {
    const response = await apiClient.get('/instanceSettings');
    return response.data;
  },

  update: async (settings) => {
    const response = await apiClient.put('/instanceSettings', settings);
    return response.data;
  },
};

export default instanceSettingsService;
