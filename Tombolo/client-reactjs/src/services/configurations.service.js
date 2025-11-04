import { apiClient } from '@/services/api';

const configurationsService = {
  getInstanceDetails: async () => {
    const response = await apiClient.get('/configurations/instanceDetails');
    return response.data;
  },
};

export default configurationsService;
