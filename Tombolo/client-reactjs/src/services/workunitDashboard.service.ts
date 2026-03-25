import { apiClient } from '@/services/api';
import type { DashboardSummary } from '@/components/admin/workunits/dashboard/cards/CostSummary';
import type { DailyCost } from '@/components/admin/workunits/dashboard/cards/CostBarChart';
import type { ClusterCost } from '@/components/admin/workunits/dashboard/cards/CostByEnvironment';
import type { ProblematicJob } from '@/components/admin/workunits/dashboard/cards/ProblematicJobs';

export interface OwnerCost {
  owner: string;
  cost: number;
  count: number;
}

export interface ExpensiveWorkunit {
  wuId: string;
  jobName: string;
  clusterId: string;
  owner: string;
  state: string;
  totalCost: number;
  executeCost: number;
  fileAccessCost: number;
  compileCost: number;
  totalClusterTime: number;
  workUnitTimestamp: string;
  detailsFetchedAt: string | null;
}

export interface DashboardData {
  summary: DashboardSummary;
  dailyCosts: DailyCost[];
  clusterBreakdown: ClusterCost[];
  ownerBreakdown: OwnerCost[];
  problematicJobs: ProblematicJob[];
  expensiveWorkunits: ExpensiveWorkunit[];
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
