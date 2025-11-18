import { apiClient } from '@/services/api';

const orbitProfileMonitoringService = {
  create: async data => {
    const response = await apiClient.post(`/orbitProfileMonitoring`, data);
    return response.data;
  },

  getAll: async applicationId => {
    const response = await apiClient.get(`/orbitProfileMonitoring/getAll/${applicationId}`);
    return response.data;
  },

  getById: async id => {
    const response = await apiClient.get(`/orbitProfileMonitoring/getOne/${id}`);
    return response.data;
  },

  updateOne: async (id, updatedData) => {
    const response = await apiClient.put(`/orbitProfileMonitoring/${id}`, updatedData);
    return response.data;
  },

  delete: async ids => {
    const response = await apiClient.delete('/orbitProfileMonitoring/', {
      data: { ids },
    });
    return response.data;
  },

  toggleStatus: async (ids, isActive) => {
    const response = await apiClient.patch('/orbitProfileMonitoring/toggleStatus', {
      ids,
      isActive,
    });
    return response.data;
  },

  evaluate: async formData => {
    const response = await apiClient.patch('/orbitProfileMonitoring/evaluate', formData);
    return response.data;
  },
};

export default orbitProfileMonitoringService;
