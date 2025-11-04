import { apiClient } from '@/services/api';

const jobMonitoringService = {
  create: async ({ inputData }) => {
    const response = await apiClient.post('/jobmonitoring', inputData);
    return response.data;
  },

  getAll: async ({ applicationId }) => {
    const response = await apiClient.get(`/jobmonitoring/all/${applicationId}`);
    return response.data;
  },

  getById: async ({ id }) => {
    const response = await apiClient.get(`/jobmonitoring/${id}`);
    return response.data;
  },

  updateOne: async ({ updatedData }) => {
    const response = await apiClient.patch('/jobmonitoring', updatedData);
    return response.data;
  },

  evaluate: async (formData) => {
    const response = await apiClient.patch('/jobmonitoring/evaluate', formData);
    return response.data;
  },

  delete: async ({ id }) => {
    const response = await apiClient.delete(`/jobmonitoring/${id}`);
    return response.data;
  },

  bulkDelete: async ({ ids }) => {
    const response = await apiClient.delete('/jobmonitoring/bulkDelete', {
      data: { ids },
    });
    return response.data;
  },

  toggle: async ({ ids, action }) => {
    const response = await apiClient.patch('/jobmonitoring/toggleIsActive', { ids, action });
    return response.data;
  },

  bulkUpdate: async ({ updatedData }) => {
    const response = await apiClient.patch('/jobmonitoring/bulkUpdate', { metaData: updatedData });
    return response.data;
  },

  getData: async ({ id }) => {
    const response = await apiClient.get(`/jobmonitoring/data/${id}`);
    return response.data;
  },
};

export default jobMonitoringService;
