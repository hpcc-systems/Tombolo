import { apiClient } from '@/services/api';

const workunitsService = {
  getAll: async (params: Record<string, any> = {}): Promise<any> => {
    const response = await apiClient.get('/workunits', { params });
    return response.data;
  },

  getById: async (clusterId: string, wuid: string): Promise<any> => {
    const response = await apiClient.get(`/workunits/${clusterId}/${wuid}`);
    return response.data;
  },

  getDetails: async (clusterId: string, wuid: string): Promise<any> => {
    const response = await apiClient.get(`/workunits/${clusterId}/${wuid}/details`);
    return response.data;
  },

  getHotspots: async (clusterId: string, wuid: string, limit = 15): Promise<any> => {
    const response = await apiClient.get(`/workunits/${clusterId}/${wuid}/hotspots`, {
      params: { limit },
    });
    return response.data;
  },

  getTimeline: async (clusterId: string, wuid: string): Promise<any> => {
    const response = await apiClient.get(`/workunits/${clusterId}/${wuid}/timeline`);
    return response.data;
  },

  getJobHistory: async (clusterId: string, jobName: string, options: Record<string, any> = {}): Promise<any> => {
    const response = await apiClient.get(`/workunits/${clusterId}/job-history/${encodeURIComponent(jobName)}`, {
      params: options,
    });
    return response.data;
  },

  getJobHistoryWithStats: async (
    clusterId: string,
    jobName: string,
    options: Record<string, any> = {}
  ): Promise<any> => {
    const response = await apiClient.get(`/workunits/${clusterId}/job-history/${encodeURIComponent(jobName)}/stats`, {
      params: options,
    });
    return response.data;
  },

  compareToPrevious: async (clusterId: string, wuid: string): Promise<any> => {
    const response = await apiClient.get(`/workunits/${clusterId}/${wuid}/compare-previous`);
    return response.data;
  },
};

export default workunitsService;
