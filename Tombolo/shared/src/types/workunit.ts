/**
 * Shared WorkUnit type representing a work unit record from the database.
 * Dates are serialized as ISO strings when sent over the API.
 */
export interface WorkUnit {
  wuId: string;
  clusterId: string;
  workUnitTimestamp: string;
  owner: string;
  engine: string;
  jobName?: string | null;
  state: string;
  protected: boolean;
  actionEx?: string | null;
  isPausing: boolean;
  thorLcr: boolean;
  totalClusterTime: number;
  executeCost: number;
  fileAccessCost: number;
  compileCost: number;
  totalCost: number;
  endTimestamp?: string | null;
  savingPotential?: number | null;
  detailsFetchedAt?: string | null;
  infoFetchedAt?: string | null;
  clusterDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
