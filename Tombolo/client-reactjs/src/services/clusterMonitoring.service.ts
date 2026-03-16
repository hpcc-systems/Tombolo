import { apiClient } from '@/services/api';
import type { ClusterMonitoringDTO } from '@tombolo/shared';

const clusterMonitoringService = {
  create: async (data: any): Promise<ClusterMonitoringDTO> => {
    const response = await apiClient.post('/clusterMonitoring', data);
    return response.data;
  },

  getAll: async (): Promise<ClusterMonitoringDTO[]> => {
    const response = await apiClient.get('/clusterMonitoring');
    return response.data;
  },

  update: async (data: any): Promise<ClusterMonitoringDTO> => {
    const response = await apiClient.put('/clusterMonitoring', data);
    return response.data;
  },

  evaluate: async (data: any): Promise<any> => {
    const response = await apiClient.patch('/clusterMonitoring/evaluate', data);
    return response.data;
  },

  toggleBulk: async ({ ids, isActive }: { ids: string[]; isActive: boolean }): Promise<any> => {
    const response = await apiClient.patch('/clusterMonitoring/bulkToggle', { ids, isActive });
    return response.data;
  },

  toggleSingle: async (id: string): Promise<any> => {
    const response = await apiClient.patch('/clusterMonitoring/toggle', { id: [id] });
    return response.data;
  },

  delete: async (id: string): Promise<any> => {
    const response = await apiClient.delete('/clusterMonitoring', {
      data: { ids: [id] },
    });
    return response.data;
  },

  bulkUpdate: async ({ updatedData }: { updatedData: any }): Promise<any> => {
    const response = await apiClient.patch('/clusterMonitoring/bulkUpdate', { clusterMonitoring: updatedData });
    return response.data;
  },
};

export default clusterMonitoringService;
