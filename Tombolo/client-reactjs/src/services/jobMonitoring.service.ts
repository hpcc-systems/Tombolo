import { apiClient } from '@/services/api';
import type { JobMonitoringDTO } from '@tombolo/shared';

const jobMonitoringService = {
  create: async ({ inputData }: { inputData: any }): Promise<JobMonitoringDTO> => {
    const response = await apiClient.post('/jobmonitoring', inputData);
    return response.data;
  },

  getAll: async ({ applicationId }: { applicationId: string }): Promise<JobMonitoringDTO[]> => {
    const response = await apiClient.get(`/jobmonitoring/all/${applicationId}`);
    return response.data;
  },

  getById: async ({ id }: { id: string }): Promise<JobMonitoringDTO> => {
    const response = await apiClient.get(`/jobmonitoring/${id}`);
    return response.data;
  },

  updateOne: async ({ updatedData }: { updatedData: any }): Promise<JobMonitoringDTO> => {
    const response = await apiClient.patch('/jobmonitoring', updatedData);
    return response.data;
  },

  evaluate: async (formData: any): Promise<any> => {
    const response = await apiClient.patch('/jobmonitoring/evaluate', formData);
    return response.data;
  },

  delete: async ({ id }: { id: string }): Promise<any> => {
    const response = await apiClient.delete(`/jobmonitoring/${id}`);
    return response.data;
  },

  bulkDelete: async ({ ids }: { ids: string[] }): Promise<any> => {
    const response = await apiClient.delete('/jobmonitoring/bulkDelete', {
      data: { ids },
    });
    return response.data;
  },

  toggle: async ({ ids, action }: { ids: string[]; action: boolean }): Promise<any> => {
    const response = await apiClient.patch('/jobmonitoring/toggleIsActive', { ids, action });
    return response.data;
  },

  bulkUpdate: async ({ updatedData }: { updatedData: any }): Promise<any> => {
    const response = await apiClient.patch('/jobmonitoring/bulkUpdate', { metaData: updatedData });
    return response.data;
  },

  getData: async ({ id }: { id: string }): Promise<any> => {
    const response = await apiClient.get(`/jobmonitoring/data/${id}`);
    return response.data;
  },
};

export default jobMonitoringService;
