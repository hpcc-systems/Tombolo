import { apiClient } from '@/services/api';

const fileMonitoringService = {
  create: async ({ inputData }) => {
    const response = await apiClient.post('/fileMonitoring', inputData);
    return response.data;
  },

  getAll: async ({ applicationId }) => {
    const response = await apiClient.get(`/fileMonitoring/all/${applicationId}`);
    return response.data;
  },

  updateOne: async (updatedData, id) => {
    const response = await apiClient.put(`/fileMonitoring/${id}`, updatedData);
    return response.data;
  },

  evaluate: async (formData) => {
    const response = await apiClient.patch('/fileMonitoring/evaluate', formData);
    return response.data;
  },

  delete: async (ids) => {
    const response = await apiClient.delete('/fileMonitoring', {
      data: { ids },
    });
    return response.data;
  },

  toggle: async ({ ids, action }) => {
    const isActive = action === 'start';
    const response = await apiClient.patch('/fileMonitoring/toggle', { ids, isActive });
    return response.data;
  },

  bulkUpdate: async ({ updatedData }) => {
    const response = await apiClient.patch('/fileMonitoring/bulk', { updatedData });
    return response.data;
  },
};

export default fileMonitoringService;
