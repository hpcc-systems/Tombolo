import { apiClient } from '@/services/api';

const instanceSettingsService = {
  getAll: async (): Promise<any> => {
    const response = await apiClient.get('/instanceSettings');
    return response.data;
  },

  update: async (settings: any): Promise<any> => {
    const response = await apiClient.put('/instanceSettings', settings);
    return response.data;
  },
};

export default instanceSettingsService;
