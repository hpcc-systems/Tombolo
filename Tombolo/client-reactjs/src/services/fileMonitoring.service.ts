import { apiClient } from '@/services/api';
import type { FileMonitoringDTO } from '@tombolo/shared';

const fileMonitoringService = {
  create: async ({ inputData }: { inputData: any }): Promise<FileMonitoringDTO> => {
    const response = await apiClient.post('/fileMonitoring', inputData);
    return response.data;
  },

  getAll: async ({ applicationId }: { applicationId: string }): Promise<FileMonitoringDTO[]> => {
    const response = await apiClient.get(`/fileMonitoring/all/${applicationId}`);
    return response.data;
  },

  updateOne: async (updatedData: any, id: string): Promise<FileMonitoringDTO> => {
    const response = await apiClient.put(`/fileMonitoring/${id}`, updatedData);
    return response.data;
  },

  evaluate: async (formData: any): Promise<any> => {
    const response = await apiClient.patch('/fileMonitoring/evaluate', formData);
    return response.data;
  },

  delete: async (ids: string[]): Promise<any> => {
    const response = await apiClient.delete('/fileMonitoring', {
      data: { ids },
    });
    return response.data;
  },

  toggle: async ({ ids, action }: { ids: string[]; action: string }): Promise<any> => {
    const isActive = action === 'start';
    const response = await apiClient.patch('/fileMonitoring/toggle', { ids, isActive });
    return response.data;
  },

  bulkUpdate: async ({ updatedData }: { updatedData: any }): Promise<any> => {
    const response = await apiClient.patch('/fileMonitoring/bulk', { updatedData });
    return response.data;
  },
};

export default fileMonitoringService;
