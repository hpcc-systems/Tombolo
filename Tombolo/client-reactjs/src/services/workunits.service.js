import { apiClient } from '@/services/api';

const workunitsService = {
  /**
   * Get list of workunits with filters and pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 50)
   * @param {string} params.clusterId - Filter by cluster ID
   * @param {string} params.state - Filter by state (comma-separated)
   * @param {string} params.owner - Filter by owner (partial match)
   * @param {string} params.jobName - Filter by job name (partial match)
   * @param {string} params.dateFrom - Filter by date from (ISO string)
   * @param {string} params.dateTo - Filter by date to (ISO string)
   * @param {number} params.costAbove - Filter by cost above value
   * @param {string} params.sort - Sort field (default: 'workUnitTimestamp')
   * @param {string} params.order - Sort order ('asc' or 'desc', default: 'desc')
   * @returns {Promise<{total: number, page: number, limit: number, data: Array}>}
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get('/workunits', { params });
    return response.data;
  },

  /**
   * Get a single workunit by clusterId and ID
   * @param {string} clusterId - Cluster ID
   * @param {string} wuid - Workunit ID
   * @returns {Promise<Object>}
   */
  getById: async (clusterId, wuid) => {
    const response = await apiClient.get(`/workunits/${clusterId}/${wuid}`);
    return response.data;
  },

  /**
   * Get hierarchical scope details for a workunit
   * @param {string} clusterId - Cluster ID
   * @param {string} wuid - Workunit ID
   * @returns {Promise<{wuId: string, fetchedAt: string, graphs: Array}>}
   */
  getDetails: async (clusterId, wuid) => {
    const response = await apiClient.get(`/workunits/${clusterId}/${wuid}/details`);
    return response.data;
  },

  /**
   * Get performance hotspots for a workunit
   * @param {string} clusterId - Cluster ID
   * @param {string} wuid - Workunit ID
   * @param {number} limit - Number of hotspots to return (default: 15)
   * @returns {Promise<Array>}
   */
  getHotspots: async (clusterId, wuid, limit = 15) => {
    const response = await apiClient.get(`/workunits/${clusterId}/${wuid}/hotspots`, {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get timeline data for Gantt/Timeline visualization
   * @param {string} clusterId - Cluster ID
   * @param {string} wuid - Workunit ID
   * @returns {Promise<Array>}
   */
  getTimeline: async (clusterId, wuid) => {
    const response = await apiClient.get(`/workunits/${clusterId}/${wuid}/timeline`);
    return response.data;
  },
};

export default workunitsService;
