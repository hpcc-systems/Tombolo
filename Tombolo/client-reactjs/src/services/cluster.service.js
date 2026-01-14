import { apiClient } from '@/services/api';

class ClusterService {
  // Get cluster storage history
  async getClusterStorageHistory(queryData) {
    const response = await apiClient.get(`/cluster/clusterStorageHistory/${queryData}`);
    return response.data;
  }

  // Get current cluster usage
  async getCurrentClusterUsage(clusterId) {
    const response = await apiClient.get(`/cluster/currentClusterUsage/${clusterId}`);
    return response.data;
  }
}

export default new ClusterService();
