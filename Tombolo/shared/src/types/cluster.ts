export interface ClusterAttributes {
  id: string;
  name: string;
  thor_host: string;
  thor_port: string;
  roxie_host: string;
  roxie_port: string;
  username?: string | null;
  hash?: string | null;
  defaultEngine: string;
  timezone_offset: number;
  allowSelfSigned?: boolean;
  containerized?: boolean;
  currencyCode?: string;
  accountMetaData?: Record<string, any> | null;
  adminEmails?: any[] | null;
  reachabilityInfo?: Record<string, any> | null;
  storageUsageHistory?: Record<string, any> | null;
  metaData?: Record<string, any> | null;
  createdBy: string;
  updatedBy?: string | null;
  deletedBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;

  // Associations
  fileMonitorings?: any[];
  landingZoneMonitorings?: any[];
  clusterMonitorings?: any[];
}

export type ClusterDTO = ClusterAttributes;

// UI-friendly cluster type for client components
export interface ClusterUI extends ClusterAttributes {
  // optional runtime-only status field used by the UI
  status?: string;

  // reachabilityInfo is already present; ensure optional typing
  reachabilityInfo?: Record<string, any> | null;
}

export type ClusterUIDTO = ClusterUI;
