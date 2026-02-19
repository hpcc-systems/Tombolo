import { apiClient } from '@/services/api';

const workunitDashboardService = {
  /**
   * Get workunit dashboard data with aggregations
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (ISO string, required)
   * @param {string} params.endDate - End date (ISO string, required)
   * @param {string} params.clusterId - Cluster ID (UUID, optional)
   * @returns {Promise<{
   *   summary: { totalCost, totalJobs, avgCostPerJob, totalCpuHours, failedCount, failedCost },
   *   dailyCosts: Array<{ date, cost }>,
   *   clusterBreakdown: Array<{ cluster, cost, count }>,
   *   ownerBreakdown: Array<{ owner, cost, count }>,
   *   problematicJobs: Array<{ wuid, jobName, issue, severity, cost, owner, cluster }>,
   *   workunits: Array<{ wuid, jobName, cluster, owner, state, cost, cpuHours, duration, startTime, costBreakdown }>
   * }>}
   */
  getDashboardData: async params => {
    const response = await apiClient.get('/workunit-dashboard', { params });
    return response.data; // dataExtractorInterceptor already unwraps response.data.data to response.data
  },
};

export default workunitDashboardService;
