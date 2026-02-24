import { apiClient } from '@/services/api';
import type { DashboardSummary } from '@/components/admin/workunits/dashboard/cards/CostSummary';
import type { DailyCost } from '@/components/admin/workunits/dashboard/cards/CostBarChart';
import type { ClusterCost } from '@/components/admin/workunits/dashboard/cards/CostByEnvironment';
import type { ProblematicJob } from '@/components/admin/workunits/dashboard/cards/ProblematicJobs';
import type { WorkunitRecord } from '@/components/admin/workunits/dashboard/cards/WorkunitTable';

export interface OwnerCost {
  owner: string;
  cost: number;
  count: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  dailyCosts: DailyCost[];
  clusterBreakdown: ClusterCost[];
  ownerBreakdown: OwnerCost[];
  problematicJobs: ProblematicJob[];
  workunits: WorkunitRecord[];
}

export interface DashboardParams {
  startDate: string;
  endDate: string;
  clusterId?: string;
}

const workunitDashboardService = {
  getDashboardData: async (params: DashboardParams): Promise<DashboardData> => {
    const response = await apiClient.get('/workunit-dashboard', { params });
    return response.data; // dataExtractorInterceptor already unwraps response.data.data to response.data
  },
};

export default workunitDashboardService;
