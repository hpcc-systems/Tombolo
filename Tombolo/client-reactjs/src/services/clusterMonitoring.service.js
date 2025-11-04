import { apiClient } from '@/services/api';

const clusterMonitoringService = {
  create: async (data) => {
    const response = await apiClient.post('/clusterMonitoring', data);
    return response.data;
  },

  getAll: async () => {
    const response = await apiClient.get('/clusterMonitoring');
    return response.data;
  },

  update: async (data) => {
    const response = await apiClient.put('/clusterMonitoring', data);
    return response.data;
  },

  evaluate: async (data) => {
    const response = await apiClient.patch('/clusterMonitoring/evaluate', data);
    return response.data;
  },

  toggleBulk: async ({ ids, isActive }) => {
    const response = await apiClient.patch('/clusterMonitoring/bulkToggle', { ids, isActive });
    return response.data;
  },

  toggleSingle: async (id) => {
    const response = await apiClient.patch('/clusterMonitoring/toggle', { id: [id] });
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete('/clusterMonitoring', {
      data: { ids: [id] },
    });
    return response.data;
  },

  bulkUpdate: async ({ updatedData }) => {
    const response = await apiClient.patch('/clusterMonitoring/bulkUpdate', { clusterMonitoring: updatedData });
    return response.data;
  },
};

export default clusterMonitoringService;
