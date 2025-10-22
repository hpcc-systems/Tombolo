import { apiClient } from '@/services/api';

const statusService = {
  // Check backend status
  checkBackendStatus: async () => {
    const response = await apiClient.get('/status');
    return response;
  },

  // Check if owner exists
  checkOwnerExists: async () => {
    const response = await apiClient.get('/status/ownerExists');
    return response.data;
  },
};

export default statusService;
