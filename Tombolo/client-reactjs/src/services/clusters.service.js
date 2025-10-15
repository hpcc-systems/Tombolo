import { apiClient } from '@/services/api';
import { authHeader } from '@/components/common/AuthHeader';

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

  // For SSE, we need to use fetch directly since axios doesn't handle SSE well
  addWithProgress: async ({ clusterInfo, abortController }) => {
    const response = await fetch('/api/cluster/addClusterWithProgress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Get auth header from local storage or context
        ...authHeader(),
      },
      body: JSON.stringify(clusterInfo),
      signal: abortController?.signal,
    });
    return response;
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
