// Job Monitoring
export interface JobMonitoringAttributes {
  id: string;
  applicationId: string;
  monitoringName: string;
  isActive?: boolean;
  approvalStatus: 'approved' | 'rejected' | 'pending';
  approvedBy?: string | null;
  approvedAt?: Date | string | null;
  approverComment?: string | null;
  description: string;
  monitoringScope: string;
  clusterId: string;
  jobName: string;
  lastJobRunDetails?: any | null;
  metaData: any;
  createdBy: string;
  lastUpdatedBy?: string | null;
  deletedBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;

  // Associations
  application?: any;
  cluster?: any;
  creator?: any;
  updater?: any;
  approver?: any;
}

export type JobMonitoringDTO = JobMonitoringAttributes;

// File Monitoring
export interface FileMonitoringAttributes {
  id: string;
  monitoringName: string;
  description?: string | null;
  applicationId: string;
  clusterId: string;
  fileMonitoringType: 'stdLogicalFile' | 'superFile';
  isActive?: boolean | null;
  approvalStatus: 'approved' | 'rejected' | 'pending';
  metaData?: any | null;
  approvedBy?: string | null;
  approvedAt?: Date | string | null;
  approverComment?: string | null;
  createdBy: string;
  lastUpdatedBy?: string | null;
  deletedBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string | null;
  deletedAt?: Date | string | null;

  // Associations
  application?: any;
  cluster?: any;
  creator?: any;
  updater?: any;
  approver?: any;
}

export type FileMonitoringDTO = FileMonitoringAttributes;

// Landing Zone Monitoring
export interface LandingZoneMonitoringAttributes {
  id: string;
  applicationId: string;
  monitoringName: string;
  isActive: boolean;
  lzMonitoringType: 'fileCount' | 'spaceUsage' | 'fileMovement';
  approvalStatus: 'approved' | 'rejected' | 'pending';
  approvedBy?: string | null;
  approvedAt?: Date | string | null;
  approverComment?: string | null;
  description: string;
  clusterId: string;
  lastRunDetails?: any | null;
  metaData: any;
  createdBy: string;
  lastUpdatedBy: string;
  deletedBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;

  // Associations
  application?: any;
  cluster?: any;
  creator?: any;
  updater?: any;
  approver?: any;
}

export type LandingZoneMonitoringDTO = LandingZoneMonitoringAttributes;

// Cluster Monitoring
export interface ClusterMonitoringAttributes {
  id: string;
  monitoringName: string;
  clusterMonitoringType: string[];
  isActive?: boolean;
  approvalStatus: 'approved' | 'rejected' | 'pending';
  approvedBy?: string | null;
  approvedAt?: Date | string | null;
  approverComment?: string | null;
  description: string;
  clusterId: string;
  lastRunDetails?: any | null;
  metaData: any;
  createdBy: string;
  lastUpdatedBy: string;
  deletedBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;

  // Associations
  cluster?: any;
  creator?: any;
  updater?: any;
  approver?: any;
}

export type ClusterMonitoringDTO = ClusterMonitoringAttributes;

// Cost Monitoring
export interface CostMonitoringAttributes {
  id: string;
  applicationId: string;
  monitoringScope?: string;
  monitoringName: string;
  isSummed?: boolean;
  isActive?: boolean;
  approvalStatus: 'approved' | 'rejected' | 'pending';
  approvedBy?: string | null;
  approvedAt?: Date | string | null;
  approverComment?: string | null;
  description: string;
  clusterIds?: string[] | null;
  lastJobRunDetails?: any | null;
  metaData: any;
  createdBy: string;
  lastUpdatedBy?: string | null;
  deletedBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;

  // Associations
  application?: any;
  creator?: any;
  updater?: any;
  approver?: any;
}

export type CostMonitoringDTO = CostMonitoringAttributes;

// Orbit Profile Monitoring
export interface OrbitProfileMonitoringAttributes {
  id: string;
  applicationId: string;
  monitoringName: string;
  description: string;
  isActive?: boolean;
  approvalStatus: 'approved' | 'rejected' | 'pending';
  approvedBy?: string | null;
  approvedAt?: Date | string | null;
  approverComment?: string | null;
  lastRunDetails?: any | null;
  metaData: any;
  createdBy: string;
  lastUpdatedBy: string;
  deletedBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;

  // Associations
  application?: any;
  creator?: any;
  updater?: any;
  approver?: any;
}

export type OrbitProfileMonitoringDTO = OrbitProfileMonitoringAttributes;
