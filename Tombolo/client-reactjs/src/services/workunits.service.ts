import { apiClient } from '@/services/api';
import type { WorkUnit, WorkUnitDetailsResponse } from '@tombolo/shared';

const workunitsService = {
  getAll: async (params: Record<string, any> = {}): Promise<any> => {
    const response = await apiClient.get('/workunits', { params });
    return response.data;
  },

  getById: async (clusterId: string, wuid: string): Promise<WorkUnit> => {
    const response = await apiClient.get(`/workunits/${clusterId}/${wuid}`);
    return response.data;
  },

  getDetails: async (clusterId: string, wuid: string): Promise<WorkUnitDetailsResponse> => {
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

  getGraph: async (clusterId: string, wuid: string): Promise<any[]> => {
    const response = await apiClient.get(`/workunits/${clusterId}/${wuid}/graph`);
    return response.data;
  },

  // Paging & lazy fetch helpers for scopes (virtualization support)
  getScopes: async (
    clusterId: string,
    wuid: string,
    options: { limit?: number; cursor?: number } = {}
  ): Promise<any> => {
    const response = await apiClient.get(`/workunits/${clusterId}/${wuid}/scopes`, { params: options });
    return response.data;
  },

  getScopesSummary: async (clusterId: string, wuid: string): Promise<any> => {
    const response = await apiClient.get(`/workunits/${clusterId}/${wuid}/scopes/summary`);
    return response.data;
  },

  getScopeHistory: async (clusterId: string, wuid: string, scopeId: string): Promise<any> => {
    const response = await apiClient.get(
      `/workunits/${clusterId}/${wuid}/scopes/${encodeURIComponent(scopeId)}/history`
    );
    return response.data;
  },
};

export default workunitsService;
