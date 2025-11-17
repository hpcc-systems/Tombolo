import { Sequelize, Model, ModelCtor } from 'sequelize';

// Generic model type for models without specific attributes defined yet
export type GenericModel = ModelCtor<Model>;

// Application Model
export interface ApplicationAttributes {
  id: string;
  title: string;
  description: string;
  creator: string;
  visibility: 'Public' | 'Private';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface ApplicationInstance
  extends Model<ApplicationAttributes>,
    ApplicationAttributes {}
export type ApplicationModel = ModelCtor<ApplicationInstance>;

// Cluster Model
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
  allowSelfSigned: boolean;
  containerized: boolean;
  currencyCode: string;
  accountMetaData?: Record<string, any>;
  adminEmails?: any[] | null;
  reachabilityInfo?: Record<string, any>;
  storageUsageHistory?: Record<string, any>;
  metaData?: Record<string, any>;
  createdBy: string;
  updatedBy?: string | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface ClusterInstance
  extends Model<ClusterAttributes>,
    ClusterAttributes {}
export type ClusterModel = ModelCtor<ClusterInstance>;

// WorkUnit Model
export interface WorkUnitAttributes {
  wuId: string;
  clusterId: string;
  workUnitTimestamp: Date;
  owner: string;
  engine: string;
  jobName?: string | null;
  stateId: number;
  state: string;
  protected: boolean;
  action: number;
  actionEx?: string | null;
  isPausing: boolean;
  thorLcr: boolean;
  totalClusterTime: number;
  executeCost: number;
  fileAccessCost: number;
  compileCost: number;
  totalCost: number;
  detailsFetchedAt?: Date | null;
  clusterDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface WorkUnitInstance
  extends Model<WorkUnitAttributes>,
    WorkUnitAttributes {}
export type WorkUnitModel = ModelCtor<WorkUnitInstance>;

// WorkUnitDetails Model
export interface WorkUnitDetailsAttributes {
  id: number;
  clusterId: string;
  wuId: string;
  scopeId?: string | null;
  scopeName: string;
  scopeType: 'activity' | 'subgraph' | 'graph' | 'operation';
  label?: string | null;
  kind?: number | null;
  fileName?: string | null;
  // Time metrics (seconds with microsecond precision - DECIMAL(13,6))
  TimeElapsed?: number | null;
  TimeAvgElapsed?: number | null;
  TimeMinElapsed?: number | null;
  TimeMaxElapsed?: number | null;
  TimeStdDevElapsed?: number | null;
  TimeLocalExecute?: number | null;
  TimeAvgLocalExecute?: number | null;
  TimeMinLocalExecute?: number | null;
  TimeMaxLocalExecute?: number | null;
  TimeStdDevLocalExecute?: number | null;
  TimeTotalExecute?: number | null;
  TimeAvgTotalExecute?: number | null;
  TimeMinTotalExecute?: number | null;
  TimeMaxTotalExecute?: number | null;
  TimeStdDevTotalExecute?: number | null;
  TimeDiskReadIO?: number | null;
  TimeAvgDiskReadIO?: number | null;
  TimeMinDiskReadIO?: number | null;
  TimeMaxDiskReadIO?: number | null;
  TimeStdDevDiskReadIO?: number | null;
  TimeDiskWriteIO?: number | null;
  TimeAvgDiskWriteIO?: number | null;
  TimeMinDiskWriteIO?: number | null;
  TimeMaxDiskWriteIO?: number | null;
  TimeStdDevDiskWriteIO?: number | null;
  TimeBlocked?: number | null;
  TimeAvgBlocked?: number | null;
  TimeMinBlocked?: number | null;
  TimeMaxBlocked?: number | null;
  TimeStdDevBlocked?: number | null;
  TimeLookAhead?: number | null;
  TimeAvgLookAhead?: number | null;
  TimeMinLookAhead?: number | null;
  TimeMaxLookAhead?: number | null;
  TimeStdDevLookAhead?: number | null;
  TimeFirstRow?: number | null;
  // Disk I/O metrics (BIGINT)
  NumDiskRowsRead?: number | null;
  NumAvgDiskRowsRead?: number | null;
  NumMinDiskRowsRead?: number | null;
  NumMaxDiskRowsRead?: number | null;
  NumStdDevDiskRowsRead?: number | null;
  SizeDiskRead?: number | null;
  SizeAvgDiskRead?: number | null;
  SizeMinDiskRead?: number | null;
  SizeMaxDiskRead?: number | null;
  SizeStdDevDiskRead?: number | null;
  NumDiskReads?: number | null;
  NumAvgDiskReads?: number | null;
  NumMinDiskReads?: number | null;
  NumMaxDiskReads?: number | null;
  SizeDiskWrite?: number | null;
  SizeAvgDiskWrite?: number | null;
  SizeMinDiskWrite?: number | null;
  SizeMaxDiskWrite?: number | null;
  SizeStdDevDiskWrite?: number | null;
  NumDiskWrites?: number | null;
  NumAvgDiskWrites?: number | null;
  NumMinDiskWrites?: number | null;
  NumMaxDiskWrites?: number | null;
  // Memory metrics (BIGINT)
  MemoryUsage?: number | null;
  MemoryAvgUsage?: number | null;
  MemoryMinUsage?: number | null;
  MemoryMaxUsage?: number | null;
  PeakMemoryUsage?: number | null;
  PeakAvgMemoryUsage?: number | null;
  PeakMinMemoryUsage?: number | null;
  PeakMaxMemoryUsage?: number | null;
  // Spill metrics (BIGINT)
  SpillRowsWritten?: number | null;
  SpillAvgRowsWritten?: number | null;
  SpillMinRowsWritten?: number | null;
  SpillMaxRowsWritten?: number | null;
  SpillSizeWritten?: number | null;
  SpillAvgSizeWritten?: number | null;
  SpillMinSizeWritten?: number | null;
  SpillMaxSizeWritten?: number | null;
  SizeGraphSpill?: number | null;
  SizeAvgGraphSpill?: number | null;
  SizeMinGraphSpill?: number | null;
  SizeMaxGraphSpill?: number | null;
  // Row processing metrics (BIGINT)
  NumRowsProcessed?: number | null;
  NumAvgRowsProcessed?: number | null;
  NumMinRowsProcessed?: number | null;
  NumMaxRowsProcessed?: number | null;
  // Skew metrics (DECIMAL(8,2) - percentage)
  SkewMinElapsed?: number | null;
  SkewMaxElapsed?: number | null;
  SkewMinLocalExecute?: number | null;
  SkewMaxLocalExecute?: number | null;
  SkewMinTotalExecute?: number | null;
  SkewMaxTotalExecute?: number | null;
  SkewMinDiskRowsRead?: number | null;
  SkewMaxDiskRowsRead?: number | null;
  SkewMinDiskRead?: number | null;
  SkewMaxDiskRead?: number | null;
  SkewMinDiskWrite?: number | null;
  SkewMaxDiskWrite?: number | null;
  SkewMinDiskReadIO?: number | null;
  SkewMaxDiskReadIO?: number | null;
  SkewMaxDiskWriteIO?: number | null;
  // Network metrics (BIGINT and INTEGER)
  SizeNetworkWrite?: number | null;
  SizeAvgNetworkWrite?: number | null;
  SizeMinNetworkWrite?: number | null;
  SizeMaxNetworkWrite?: number | null;
  NumNetworkWrites?: number | null;
  NumAvgNetworkWrites?: number | null;
  NumMinNetworkWrites?: number | null;
  NumMaxNetworkWrites?: number | null;
  // Additional performance indicators
  MaxRowSize?: number | null;
  NumIndexRecords?: number | null;
  NumStarts?: number | null;
  NumStops?: number | null;
  OriginalSize?: number | null;
  CompressedSize?: number | null;
  ScansBlob?: number | null;
  ScansIndex?: number | null;
  WildSeeks?: number | null;
  SeeksBlob?: number | null;
  SeeksIndex?: number | null;
  // Node metrics (TINYINT - which nodes had min/max performance)
  NodeMinElapsed?: number | null;
  NodeMaxElapsed?: number | null;
  NodeMinLocalExecute?: number | null;
  NodeMaxLocalExecute?: number | null;
  NodeMinTotalExecute?: number | null;
  NodeMaxTotalExecute?: number | null;
  NodeMinDiskRowsRead?: number | null;
  NodeMaxDiskRowsRead?: number | null;
  NodeMinDiskRead?: number | null;
  NodeMaxDiskRead?: number | null;
  NodeMinDiskWrite?: number | null;
  NodeMaxDiskWrite?: number | null;
  NodeMinDiskReadIO?: number | null;
  NodeMaxDiskReadIO?: number | null;
  NodeMinDiskWriteIO?: number | null;
  NodeMaxDiskWriteIO?: number | null;
  NodeMinBlocked?: number | null;
  NodeMaxBlocked?: number | null;
  NodeMinLookAhead?: number | null;
  NodeMaxLookAhead?: number | null;
  NodeMinFirstRow?: number | null;
  NodeMaxFirstRow?: number | null;
}

export interface WorkUnitDetailsInstance
  extends Model<WorkUnitDetailsAttributes>,
    WorkUnitDetailsAttributes {}
export type WorkUnitDetailsModel = ModelCtor<WorkUnitDetailsInstance>;

// MonitoringLog Model
export interface MonitoringLogAttributes {
  id: string;
  cluster_id: string;
  monitoring_type_id: string;
  scan_time: Date;
  metaData?: Record<string, any> | null;
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
}

export interface MonitoringLogInstance
  extends Model<MonitoringLogAttributes>,
    MonitoringLogAttributes {}
export type MonitoringLogModel = ModelCtor<MonitoringLogInstance>;

// MonitoringType Model
export interface MonitoringTypeAttributes {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
  createdBy: {
    firstName: string | null;
    lastName: string;
    email: string;
  };
  updatedBy?: {
    firstName: string | null;
    lastName: string;
    email: string;
  } | null;
  deletedBy?: {
    firstName: string | null;
    lastName: string;
    email: string;
  } | null;
}

export interface MonitoringTypeInstance
  extends Model<MonitoringTypeAttributes>,
    MonitoringTypeAttributes {}
export type MonitoringTypeModel = ModelCtor<MonitoringTypeInstance>;

// Model exports
export const sequelize: Sequelize;

export const AccountVerificationCodes: GenericModel;
export const Application: ApplicationModel;
export const AsrDomain: GenericModel;
export const AsrDomainToProductsRelation: GenericModel;
export const AsrMonitoringTypeToDomainsRelation: GenericModel;
export const AsrProduct: GenericModel;
export const Cluster: ClusterModel;
export const ClusterMonitoring: GenericModel;
export const CostMonitoring: GenericModel;
export const CostMonitoringData: GenericModel;
export const DirectoryMonitoring: GenericModel;
export const FileMonitoring: GenericModel;
export const InstanceSettings: GenericModel;
export const IntegrationMapping: GenericModel;
export const Integrations: GenericModel;
export const JobMonitoring: GenericModel;
export const JobMonitoringData: GenericModel;
export const JobMonitoringDataArchive: GenericModel;
export const LandingZoneMonitoring: GenericModel;
export const License: GenericModel;
export const MonitoringLog: MonitoringLogModel;
export const MonitoringNotification: GenericModel;
export const MonitoringType: MonitoringTypeModel;
export const NotificationQueue: GenericModel;
export const OrbitBuilds: GenericModel;
export const OrbitMonitoring: GenericModel;
export const PasswordResetLink: GenericModel;
export const RefreshToken: GenericModel;
export const RoleType: GenericModel;
export const SentNotification: GenericModel;
export const TokenBlackList: GenericModel;
export const WorkUnit: WorkUnitModel;
export const WorkUnitDetails: WorkUnitDetailsModel;
export const User: GenericModel;
export const UserApplication: GenericModel;
export const UserArchive: GenericModel;
export const UserRole: GenericModel;
