export interface WorkUnit {
  wuId: string;
  clusterId: string;
  workUnitTimestamp: string;
  owner: string;
  engine: string;
  state: string;
  totalClusterTime: number;
  totalCost: number;
  jobName?: string | null;
  actionEx?: string | null;
  executeCost?: number;
  fileAccessCost?: number;
  compileCost?: number;
  endTimestamp?: string | null;
  savingPotential?: number | null;
  detailsFetchedAt?: string | null;
  infoFetchedAt?: string | null;
  clusterDeleted?: boolean;
  hasDetails?: boolean;
}

export interface WorkUnitDetailsResponse {
  wuId: string;
  clusterId: string;
  fetchedAt: string;
  graphs: unknown[];
}
