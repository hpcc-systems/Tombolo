import { apiClient } from '@/services/api';

const clustersService = {
  getAll: async () => {
    const response = await apiClient.get('/cluster');
    return response.data;
  },

  getOne: async (id) => {
    const response = await apiClient.get(`/cluster/getOne/${id}`);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/cluster/${id}`);
    return response.data;
  },

  update: async ({ id, clusterInfo }) => {
    const response = await apiClient.patch(`/cluster/${id}`, clusterInfo);
    return response.data;
  },

  getWhiteList: async () => {
    const response = await apiClient.get('/cluster/whiteList');
    return response.data;
  },

  ping: async ({ clusterInfo, abortController }) => {
    const response = await apiClient.post('/cluster/ping', clusterInfo, {
      signal: abortController?.signal,
    });
    return response.status;
  },

  checkHealth: async ({ clusterInfo, abortController }) => {
    const response = await apiClient.post('/cluster/clusterHealth', clusterInfo, {
      signal: abortController?.signal,
    });
    return response.status;
  },

  pingExisting: async ({ clusterId }) => {
    const response = await apiClient.get(`/cluster/pingExistingCluster/${clusterId}`);
    return response.status;
  },

  // SSE endpoint for cluster addition with progress updates
  addWithProgress: async ({ clusterInfo, abortController, onProgress, timeout = 180000 }) => {
    const response = await apiClient.post('/cluster/addClusterWithProgress', clusterInfo, {
      signal: abortController?.signal,
      responseType: 'text',
      timeout, // Timeout can be overridden by caller, defaults to 120 seconds for long-running cluster operations
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.event && progressEvent.event.target) {
          const text = progressEvent.event.target.responseText;
          onProgress(text);
        }
      },
    });
    return response.data;
  },
};

// Constants for cluster addition steps
export const allStepsToAddCluster = [
  { step: 1, message: 'Authenticate cluster' },
  { step: 2, message: 'Select default engine' },
  { step: 3, message: 'Get UTC time zone offset' },
  { step: 4, message: 'Get cluster build info' },
  { step: 5, message: 'Save cluster' },
];

export default clustersService;
