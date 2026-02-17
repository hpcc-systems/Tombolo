import { apiClient } from '@/services/api';
import type { ClusterDTO } from '@tombolo/shared';

const clustersService = {
  getAll: async (): Promise<ClusterDTO[]> => {
    const response = await apiClient.get('/cluster');
    return response.data;
  },

  getOne: async (id: string): Promise<ClusterDTO> => {
    const response = await apiClient.get(`/cluster/getOne/${id}`);
    return response.data;
  },

  delete: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/cluster/${id}`);
    return response.data;
  },

  update: async ({ id, clusterInfo }: { id: string; clusterInfo: any }): Promise<ClusterDTO> => {
    const response = await apiClient.patch(`/cluster/${id}`, clusterInfo);
    return response.data;
  },

  getWhiteList: async (): Promise<any> => {
    const response = await apiClient.get('/cluster/whiteList');
    return response.data;
  },

  ping: async ({
    clusterInfo,
    abortController,
  }: {
    clusterInfo: any;
    abortController?: AbortController;
  }): Promise<number> => {
    const response = await apiClient.post('/cluster/ping', clusterInfo, {
      signal: abortController?.signal,
    });
    return response.status;
  },

  checkHealth: async ({
    clusterInfo,
    abortController,
  }: {
    clusterInfo: any;
    abortController?: AbortController;
  }): Promise<number> => {
    const response = await apiClient.post('/cluster/clusterHealth', clusterInfo, {
      signal: abortController?.signal,
    });
    return response.status;
  },

  pingExisting: async ({ clusterId }: { clusterId: string }): Promise<number> => {
    const response = await apiClient.get(`/cluster/pingExistingCluster/${clusterId}`);
    return response.status;
  },

  addWithProgress: async ({
    clusterInfo,
    abortController,
    onProgress,
    timeout = 180000,
  }: {
    clusterInfo: any;
    abortController?: AbortController;
    onProgress?: (text: string) => void;
    timeout?: number;
  }): Promise<any> => {
    const response = await apiClient.post('/cluster/addClusterWithProgress', clusterInfo, {
      signal: abortController?.signal,
      responseType: 'text',
      timeout,
      onDownloadProgress: progressEvent => {
        if (onProgress && (progressEvent as any).event && (progressEvent as any).event.target) {
          const text = (progressEvent as any).event.target.responseText;
          onProgress(text);
        }
      },
    });
    return response.data;
  },

  getClusterLogs: async (clusterId: string, params = {}): Promise<any> => {
    const response = await apiClient.get(`/cluster/logs/${clusterId}`, { params });
    return response.data;
  },
};

export const allStepsToAddCluster = [
  { step: 1, message: 'Authenticate cluster' },
  { step: 2, message: 'Select default engine' },
  { step: 3, message: 'Get UTC time zone offset' },
  { step: 4, message: 'Get cluster build info' },
  { step: 5, message: 'Save cluster' },
];

export default clustersService;
