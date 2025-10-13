import { apiClient } from '@/services/api';

const costMonitoringService = {
  create: async ({ inputData }) => {
    const response = await apiClient.post('/costMonitoring', inputData);
    return response.data;
  },

  getAll: async ({ applicationId }) => {
    const response = await apiClient.get(`/costMonitoring/${applicationId}`);
    return response.data;
  },

  getById: async ({ id }) => {
    const response = await apiClient.get(`/costMonitoring/byId/${id}`);
    return response.data;
  },

  updateOne: async ({ updatedData }) => {
    const response = await apiClient.patch('/costMonitoring', updatedData);
    return response.data;
  },

  evaluate: async (formData) => {
    const response = await apiClient.patch('/costMonitoring/evaluate', formData);
    return response.data;
  },

  delete: async ({ id }) => {
    const response = await apiClient.delete(`/costMonitoring/${id}`);
    return response.data;
  },

  bulkDelete: async ({ ids }) => {
    const response = await apiClient.delete('/costMonitoring/bulk', {
      data: { ids },
    });
    return response.data;
  },

  toggle: async ({ ids, action }) => {
    const response = await apiClient.put('/costMonitoring/toggle', { ids, action });
    return response.data;
  },

  bulkUpdate: async ({ updatedData }) => {
    const response = await apiClient.patch('/costMonitoring/bulk', { costMonitorings: updatedData });
    return response.data;
  },
};

export default costMonitoringService;
