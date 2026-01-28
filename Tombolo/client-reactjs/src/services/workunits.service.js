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

  /**
   * Execute a read-only SQL SELECT against workunitDetails scoped to this workunit
   * @param {string} clusterId
   * @param {string} wuid
   * @param {string} sql
   * @returns {Promise<{columns: string[], rows: any[]}>}
   */
  executeSql: async (clusterId, wuid, sql) => {
    const response = await apiClient.post(`/workunits/${clusterId}/${wuid}/sql`, { sql });
    return response.data;
  },

  /**
   * Get history of all runs for a specific job name
   * @param {string} clusterId - Cluster ID
   * @param {string} jobName - Job name to fetch history for
   * @param {object} options - Query options
   * @param {string} options.startDate - ISO date string to filter from (optional)
   * @param {number} options.limit - Max results (default 100)
   * @returns {Promise<Array>} Array of workunit objects
   */
  async getJobHistory(clusterId, jobName, options = {}) {
    try {
      const params = new URLSearchParams();

      if (options.startDate) {
        params.append('startDate', options.startDate);
      }

      if (options.limit) {
        params.append('limit', options.limit.toString());
      }

      const response = await fetch(
        `/api/workunits/${clusterId}/job-history/${encodeURIComponent(jobName)}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch job history: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getJobHistory:', error);
      throw error;
    }
  },

  /**
   * Get job history with calculated statistics
   * @param {string} clusterId - Cluster ID
   * @param {string} jobName - Job name
   * @param {object} options - Query options
   * @returns {Promise<{runs: Array, statistics: Object}>}
   */
  async getJobHistoryWithStats(clusterId, jobName, options = {}) {
    try {
      const params = new URLSearchParams();

      if (options.startDate) {
        params.append('startDate', options.startDate);
      }

      const response = await fetch(
        `/api/workunits/${clusterId}/job-history/${encodeURIComponent(jobName)}/stats?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch job history with stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getJobHistoryWithStats:', error);
      throw error;
    }
  },

  /**
   * Compare current workunit with previous run of same job
   * @param {string} clusterId - Cluster ID
   * @param {string} wuid - Workunit ID
   * @returns {Promise<{current: Object, previous: Object, comparison: Object}>}
   */
  async compareToPrevious(clusterId, wuid) {
    try {
      const response = await fetch(`/api/workunits/${clusterId}/${wuid}/compare-previous`);

      if (!response.ok) {
        throw new Error(`Failed to compare workunit: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in compareToPrevious:', error);
      throw error;
    }
  },
};

export default workunitsService;
