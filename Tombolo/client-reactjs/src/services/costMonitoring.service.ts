import { apiClient } from '@/services/api';
import type { CostMonitoringDTO } from '@tombolo/shared';

const costMonitoringService = {
  create: async ({ inputData }: { inputData: any }): Promise<CostMonitoringDTO> => {
    const response = await apiClient.post('/costMonitoring', inputData);
    return response.data;
  },

  getAll: async ({ applicationId }: { applicationId: string }): Promise<CostMonitoringDTO[]> => {
    const response = await apiClient.get(`/costMonitoring/${applicationId}`);
    return response.data;
  },

  getById: async ({ id }: { id: string }): Promise<CostMonitoringDTO> => {
    const response = await apiClient.get(`/costMonitoring/byId/${id}`);
    return response.data;
  },

  updateOne: async ({ updatedData }: { updatedData: any }): Promise<CostMonitoringDTO> => {
    const response = await apiClient.patch('/costMonitoring', updatedData);
    return response.data;
  },

  evaluate: async (formData: any): Promise<any> => {
    const response = await apiClient.patch('/costMonitoring/evaluate', formData);
    return response.data;
  },

  delete: async ({ id }: { id: string }): Promise<any> => {
    const response = await apiClient.delete(`/costMonitoring/${id}`);
    return response.data;
  },

  bulkDelete: async ({ ids }: { ids: string[] }): Promise<any> => {
    const response = await apiClient.delete('/costMonitoring/bulk', {
      data: { ids },
    });
    return response.data;
  },

  toggle: async ({ ids, action }: { ids: string[]; action: boolean }): Promise<any> => {
    const response = await apiClient.put('/costMonitoring/toggle', { ids, action });
    return response.data;
  },

  bulkUpdate: async ({ updatedData }: { updatedData: any }): Promise<any> => {
    const response = await apiClient.patch('/costMonitoring/bulk', { costMonitorings: updatedData });
    return response.data;
  },
};

export default costMonitoringService;
