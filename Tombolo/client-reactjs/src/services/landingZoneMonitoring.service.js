import { apiClient } from '@/services/api';
const landingZoneMonitoringService = {
  create: async (data) => {
    const payload = JSON.stringify(data);
    const response = await apiClient.post('/landingZoneMonitoring', payload);
    return response;
  },

  getAll: async (applicationId) => {
    const response = await apiClient.get(`/landingZoneMonitoring/all/${applicationId}`);
    return response.data;
  },

  updateOne: async (updatedData) => {
    const response = await apiClient.patch('/landingZoneMonitoring', updatedData);
    return response.data;
  },

  approveMonitoring: async (formData) => {
    const response = await apiClient.patch('/landingZoneMonitoring/evaluate', formData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/landingZoneMonitoring/${id}`);
    return response.data;
  },

  toggle: async (ids, isActive) => {
    const response = await apiClient.patch('/landingZoneMonitoring/toggleStatus', { ids, isActive });
    return response.data;
  },

  bulkDelete: async (ids) => {
    const response = await apiClient.delete('/landingZoneMonitoring/bulkDelete', {
      data: { ids },
    });
    return response.data;
  },

  bulkUpdate: async (updateData) => {
    const response = await apiClient.patch('/landingZoneMonitoring/bulkUpdate', { updatedData: updateData });
    return response.data;
  },

  bulkApprove: async (formData) => {
    const response = await apiClient.post('/landingZoneMonitoring/bulkApprove', formData);
    return response.data;
  },

  getDropZones: async (clusterId) => {
    const response = await apiClient.get(`/landingZoneMonitoring/getDropZones?clusterId=${clusterId}`);
    return response.data;
  },

  getDirectoryList: async ({ clusterId, dropzoneName, netaddr, path, signal }) => {
    const queryParams = new URLSearchParams({
      clusterId,
      DropZoneName: dropzoneName,
      Netaddr: netaddr,
      Path: path,
      DirectoryOnly: 'true',
    });
    const response = await apiClient.get(`landingZoneMonitoring/fileList?${queryParams}`, { signal });
    return response.data;
  },
};

export default landingZoneMonitoringService;
