import { apiClient } from '@/services/api';
import type { LandingZoneMonitoringDTO } from '@tombolo/shared';

const landingZoneMonitoringService = {
  create: async (data: any): Promise<LandingZoneMonitoringDTO> => {
    const payload = JSON.stringify(data);
    const response = await apiClient.post('/landingZoneMonitoring', payload);
    return response.data;
  },

  getAll: async (applicationId: string): Promise<LandingZoneMonitoringDTO[]> => {
    const response = await apiClient.get(`/landingZoneMonitoring/all/${applicationId}`);
    return response.data;
  },

  updateOne: async (updatedData: any): Promise<LandingZoneMonitoringDTO> => {
    const response = await apiClient.patch('/landingZoneMonitoring', updatedData);
    return response.data;
  },

  approveMonitoring: async (formData: any): Promise<any> => {
    const response = await apiClient.patch('/landingZoneMonitoring/evaluate', formData);
    return response.data;
  },

  delete: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/landingZoneMonitoring/${id}`);
    return response.data;
  },

  toggle: async (ids: string[], isActive: boolean): Promise<any> => {
    const response = await apiClient.patch('/landingZoneMonitoring/toggleStatus', { ids, isActive });
    return response.data;
  },

  bulkDelete: async (ids: string[]): Promise<any> => {
    const response = await apiClient.delete('/landingZoneMonitoring/bulkDelete', {
      data: { ids },
    });
    return response.data;
  },

  bulkUpdate: async (updateData: any): Promise<any> => {
    const response = await apiClient.patch('/landingZoneMonitoring/bulkUpdate', { updatedData: updateData });
    return response.data;
  },

  bulkApprove: async (formData: any): Promise<any> => {
    const response = await apiClient.post('/landingZoneMonitoring/bulkApprove', formData);
    return response.data;
  },

  getDropZones: async (clusterId: string): Promise<any> => {
    const response = await apiClient.get(`/landingZoneMonitoring/getDropZones?clusterId=${clusterId}`);
    return response.data;
  },

  getDirectoryList: async ({
    clusterId,
    dropzoneName,
    netaddr,
    path,
    signal,
  }: {
    clusterId: string;
    dropzoneName?: string;
    netaddr?: string;
    path?: string;
    signal?: AbortSignal;
  }): Promise<any> => {
    const queryParams = new URLSearchParams({
      clusterId,
      DropZoneName: dropzoneName || '',
      Netaddr: netaddr || '',
      Path: path || '',
      DirectoryOnly: 'true',
    });
    const response = await apiClient.get(`landingZoneMonitoring/fileList?${queryParams}`, { signal });
    return response.data;
  },
};

export default landingZoneMonitoringService;
