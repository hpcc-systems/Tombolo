import { apiClient } from '@/services/api';

const statusService = {
  checkBackendStatus: async (): Promise<any> => {
    const response = await apiClient.get('/status');
    return response;
  },

  checkOwnerExists: async (): Promise<any> => {
    const response = await apiClient.get('/status/ownerExists');
    return response.data;
  },
};

export default statusService;
