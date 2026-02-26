import { apiClient } from '@/services/api';
import type { OrbitProfileMonitoringDTO } from '@tombolo/shared';

const orbitProfileMonitoringService = {
  create: async (data: any): Promise<OrbitProfileMonitoringDTO> => {
    const response = await apiClient.post(`/orbitProfileMonitoring`, data);
    return response.data;
  },

  getAll: async ({ applicationId }: { applicationId: string }): Promise<OrbitProfileMonitoringDTO[]> => {
    const response = await apiClient.get(`/orbitProfileMonitoring/getAll/${applicationId}`);
    return response.data;
  },

  getById: async (id: string): Promise<OrbitProfileMonitoringDTO> => {
    const response = await apiClient.get(`/orbitProfileMonitoring/getOne/${id}`);
    return response.data;
  },

  updateOne: async (id: string, updatedData: any): Promise<OrbitProfileMonitoringDTO> => {
    const response = await apiClient.put(`/orbitProfileMonitoring/${id}`, updatedData);
    return response.data;
  },

  delete: async (ids: string[]): Promise<any> => {
    const response = await apiClient.delete('/orbitProfileMonitoring/', {
      data: { ids },
    });
    return response.data;
  },

  toggleStatus: async (ids: string[], isActive: boolean): Promise<any> => {
    const response = await apiClient.patch('/orbitProfileMonitoring/toggleStatus', {
      ids,
      isActive,
    });
    return response.data;
  },

  evaluate: async (formData: any): Promise<any> => {
    const response = await apiClient.patch('/orbitProfileMonitoring/evaluate', formData);
    return response.data;
  },

  bulkUpdate: async (monitorings: any[]): Promise<any> => {
    const response = await apiClient.patch('/orbitProfileMonitoring/bulk', { monitorings });
    return response.data;
  },
};

export default orbitProfileMonitoringService;
