import { apiClient } from '@/services/api';

const clustersService = {
  getAll: async () => {
    const response = await apiClient.get('/cluster');
    return response.data;
  },
};

export default clustersService;
