import { apiClient } from '@/services/api';

class ClusterService {
  async getClusterStorageHistory(queryData: string): Promise<any> {
    const response = await apiClient.get(`/cluster/clusterStorageHistory/${queryData}`);
    return response.data;
  }

  async getCurrentClusterUsage(clusterId: string): Promise<any> {
    const response = await apiClient.get(`/cluster/currentClusterUsage/${clusterId}`);
    return response.data;
  }
}

export default new ClusterService();
