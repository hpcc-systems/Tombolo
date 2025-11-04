import { apiClient } from '@/services/api';

const orbitService = {
  getAllMonitoring: async ({ applicationId }) => {
    const response = await apiClient.get(`/orbit/allMonitoring/${applicationId}`);
    return response.data;
  },

  getWorkUnits: async ({ applicationId }) => {
    const response = await apiClient.get(`/orbit/getWorkUnits/${applicationId}`);
    return response.data;
  },
};

export default orbitService;
