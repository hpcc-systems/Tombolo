import apiClient from './apiClient';

const statusService = {
  // Check backend status
  checkBackendStatus: async () => {
    const response = await apiClient.get('/api/status');
    return response.data;
  },

  // Check if owner exists
  checkOwnerExists: async () => {
    const response = await apiClient.get('/api/status/ownerExists');
    return response.data;
  },
};

export default statusService;
