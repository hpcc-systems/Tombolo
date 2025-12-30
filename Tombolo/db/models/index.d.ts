import { Sequelize, Model, ModelCtor } from 'sequelize';

export { Transaction } from 'sequelize';

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
  extends Model<ApplicationAttributes>, ApplicationAttributes {}
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
  extends Model<ClusterAttributes>, ClusterAttributes {}
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
  exceptionsFetchedAt?: Date | null;
  clusterDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface WorkUnitInstance
  extends Model<WorkUnitAttributes>, WorkUnitAttributes {}
export type WorkUnitModel = ModelCtor<WorkUnitInstance>;

// WorkUnitDetails Model
export interface WorkUnitDetailsAttributes {
  id: number;
  clusterId: string;
  wuId: string;
  scopeId?: string | null;
  scopeName: string;
  scopeType: 'activity' | 'subgraph' | 'graph' | 'operation' | 'workflow' | '';
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
  extends Model<WorkUnitDetailsAttributes>, WorkUnitDetailsAttributes {}
export type WorkUnitDetailsModel = ModelCtor<WorkUnitDetailsInstance>;

// WorkUnitException Model
export interface WorkUnitExceptionAttributes {
  wuId: string;
  clusterId: string;
  severity: string;
  source?: string | null;
  code: number;
  message?: string | null;
  column?: number | null;
  lineNo?: number | null;
  fileName?: string | null;
  activity?: number | null;
  scope?: string | null;
  priority?: number | null;
  cost?: number | null;
  clusterDeleted: boolean;
  createdAt: Date;
  deletedAt?: Date | null;
}

export interface WorkUnitExceptionInstance
  extends Model<WorkUnitExceptionAttributes>, WorkUnitExceptionAttributes {}
export type WorkUnitExceptionModel = ModelCtor<WorkUnitExceptionInstance>;

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
  extends Model<MonitoringLogAttributes>, MonitoringLogAttributes {}
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
  extends Model<MonitoringTypeAttributes>, MonitoringTypeAttributes {}
export type MonitoringTypeModel = ModelCtor<MonitoringTypeInstance>;

export const sequelize: Sequelize;

export interface AccountVerificationCodeAttributes {
  id: string;
  code: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountVerificationCodeInstance
  extends
    Model<AccountVerificationCodeAttributes>,
    AccountVerificationCodeAttributes {}
export type AccountVerificationCodeModel =
  ModelCtor<AccountVerificationCodeInstance>;
export const AccountVerificationCodes: AccountVerificationCodeModel;
export const Application: ApplicationModel;

export interface AsrDomainAttributes {
  id: string;
  name: string;
  region: string;
  severityThreshold: number;
  severityAlertRecipients: Record<string, any>;
  metaData?: Record<string, any> | null;
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
  createdBy: string;
  updatedBy?: string | null;
  deletedBy?: string | null;
}

export interface AsrDomainInstance
  extends Model<AsrDomainAttributes>, AsrDomainAttributes {}
export type AsrDomainModel = ModelCtor<AsrDomainInstance>;
export const AsrDomain: AsrDomainModel;

export interface AsrProductAttributes {
  id: string;
  name: string;
  shortCode: string;
  tier: number;
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
  createdBy: string;
  updatedBy?: string | null;
  deletedBy?: string | null;
}

export interface AsrProductInstance
  extends Model<AsrProductAttributes>, AsrProductAttributes {}
export type AsrProductModel = ModelCtor<AsrProductInstance>;
export const AsrProduct: AsrProductModel;

export interface AsrDomainToProductsRelationAttributes {
  id: string;
  domain_id: string;
  product_id: string;
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
  createdBy: string;
  updatedBy?: string | null;
  deletedBy?: string | null;
}

export interface AsrDomainToProductsRelationInstance
  extends
    Model<AsrDomainToProductsRelationAttributes>,
    AsrDomainToProductsRelationAttributes {}
export type AsrDomainToProductsRelationModel =
  ModelCtor<AsrDomainToProductsRelationInstance>;
export const AsrDomainToProductsRelation: AsrDomainToProductsRelationModel;

export interface AsrMonitoringTypeToDomainsRelationAttributes {
  id: string;
  monitoring_type_id: string;
  domain_id: string;
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
  createdBy: string;
  updatedBy?: string | null;
  deletedBy?: string | null;
}

export interface AsrMonitoringTypeToDomainsRelationInstance
  extends
    Model<AsrMonitoringTypeToDomainsRelationAttributes>,
    AsrMonitoringTypeToDomainsRelationAttributes {}
export type AsrMonitoringTypeToDomainsRelationModel =
  ModelCtor<AsrMonitoringTypeToDomainsRelationInstance>;
export const AsrMonitoringTypeToDomainsRelation: AsrMonitoringTypeToDomainsRelationModel;
export const Cluster: ClusterModel;

export interface ClusterMonitoringAttributes {
  id: string;
  monitoringName: string;
  clusterMonitoringType: ('status' | 'usage')[];
  isActive: boolean;
  approvalStatus: 'approved' | 'rejected' | 'pending';
  approvedBy?: string | null;
  approvedAt?: Date | null;
  approverComment?: string | null;
  description: string;
  clusterId: string;
  lastRunDetails?: Record<string, any> | null;
  metaData: Record<string, any>;
  createdBy: string;
  lastUpdatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

export interface ClusterMonitoringInstance
  extends Model<ClusterMonitoringAttributes>, ClusterMonitoringAttributes {}
export type ClusterMonitoringModel = ModelCtor<ClusterMonitoringInstance>;
export const ClusterMonitoring: ClusterMonitoringModel;

export interface CostMonitoringAttributes {
  id: string;
  applicationId: string;
  monitoringScope: 'clusters' | 'users';
  monitoringName: string;
  isSummed: boolean;
  isActive: boolean;
  approvalStatus: 'approved' | 'rejected' | 'pending';
  approvedBy?: string | null;
  approvedAt?: Date | null;
  approverComment?: string | null;
  description: string;
  clusterIds?: string[] | null;
  lastJobRunDetails?: Record<string, any> | null;
  metaData: Record<string, any>;
  createdBy: string;
  lastUpdatedBy?: string | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CostMonitoringInstance
  extends Model<CostMonitoringAttributes>, CostMonitoringAttributes {}
export type CostMonitoringModel = ModelCtor<CostMonitoringInstance>;
export const CostMonitoring: CostMonitoringModel;
export interface CostMonitoringDataAttributes {
  id: string;
  clusterId: string;
  date: Date;
  localDay?: string | null; // DATEONLY
  usersCostInfo: Record<string, any>;
  metaData?: Record<string, any> | null;
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
}

export interface CostMonitoringDataInstance
  extends Model<CostMonitoringDataAttributes>, CostMonitoringDataAttributes {}
export type CostMonitoringDataModel = ModelCtor<CostMonitoringDataInstance>;
export const CostMonitoringData: CostMonitoringDataModel;

export interface DirectoryMonitoringAttributes {
  id: string;
  application_id: string;
  cluster_id: string;
  name: string;
  description: string;
  cron?: string | null;
  type: string;
  active: boolean;
  machine: string;
  landingZone: string;
  directory: string;
  metaData?: Record<string, any> | null;
  approved: boolean;
  approvalStatus: string;
  approvalNote?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  createdBy: string;
  updatedBy: string;
  updatedAt: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
}

export interface DirectoryMonitoringInstance
  extends Model<DirectoryMonitoringAttributes>, DirectoryMonitoringAttributes {}
export type DirectoryMonitoringModel = ModelCtor<DirectoryMonitoringInstance>;
export const DirectoryMonitoring: DirectoryMonitoringModel;
export interface FileMonitoringAttributes {
  id: string;
  monitoringName: string;
  description?: string | null;
  applicationId: string;
  clusterId: string;
  fileMonitoringType: 'stdLogicalFile' | 'superFile';
  isActive: boolean;
  approvalStatus: 'approved' | 'rejected' | 'pending';
  metaData?: Record<string, any> | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  approverComment?: string | null;
  createdBy: string;
  createdAt: Date;
  lastUpdatedBy?: string | null;
  updatedAt?: Date | null;
  deletedBy?: string | null;
  deletedAt?: Date | null;
}

export interface FileMonitoringInstance
  extends Model<FileMonitoringAttributes>, FileMonitoringAttributes {}
export type FileMonitoringModel = ModelCtor<FileMonitoringInstance>;
export const FileMonitoring: FileMonitoringModel;
export interface InstanceSettingAttributes {
  id: number;
  name: string;
  metaData: Record<string, any>;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface InstanceSettingInstance
  extends Model<InstanceSettingAttributes>, InstanceSettingAttributes {}
export type InstanceSettingModel = ModelCtor<InstanceSettingInstance>;
export const InstanceSettings: InstanceSettingModel;
export interface IntegrationMappingAttributes {
  id: string;
  integration_id?: string | null;
  application_id?: string | null;
  metaData?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IntegrationMappingInstance
  extends Model<IntegrationMappingAttributes>, IntegrationMappingAttributes {}
export type IntegrationMappingModel = ModelCtor<IntegrationMappingInstance>;
export const IntegrationMapping: IntegrationMappingModel;

export interface IntegrationAttributes {
  id: string;
  name: string;
  description: string;
  metaData?: Record<string, any> | null;
}

export interface IntegrationInstance
  extends Model<IntegrationAttributes>, IntegrationAttributes {}
export type IntegrationModel = ModelCtor<IntegrationInstance>;
export const Integrations: IntegrationModel;

export interface JobMonitoringAttributes {
  id: string;
  applicationId: string;
  monitoringName: string;
  isActive: boolean;
  approvalStatus: 'approved' | 'rejected' | 'pending';
  approvedBy?: string | null;
  approvedAt?: Date | null;
  approverComment?: string | null;
  description: string;
  monitoringScope: string;
  clusterId: string;
  jobName: string;
  lastJobRunDetails?: Record<string, any> | null;
  metaData: Record<string, any>;
  createdBy: string;
  lastUpdatedBy?: string | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface JobMonitoringInstance
  extends Model<JobMonitoringAttributes>, JobMonitoringAttributes {}
export type JobMonitoringModel = ModelCtor<JobMonitoringInstance>;
export const JobMonitoring: JobMonitoringModel;

export interface JobMonitoringDataAttributes {
  id: string;
  applicationId: string;
  wuId: string;
  wuState: string;
  monitoringId: string;
  date: Date;
  wuTopLevelInfo: Record<string, any>;
  wuDetailInfo: Record<string, any>;
  analyzed: boolean;
  metaData?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface JobMonitoringDataInstance
  extends Model<JobMonitoringDataAttributes>, JobMonitoringDataAttributes {}
export type JobMonitoringDataModel = ModelCtor<JobMonitoringDataInstance>;
export const JobMonitoringData: JobMonitoringDataModel;

export interface JobMonitoringDataArchiveAttributes {
  id: string;
  applicationId: string;
  wuId: string;
  wuState: string;
  monitoringId: string;
  date: Date;
  wuTopLevelInfo: Record<string, any>;
  wuDetailInfo: Record<string, any>;
  analyzed: boolean;
  metaData?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface JobMonitoringDataArchiveInstance
  extends
    Model<JobMonitoringDataArchiveAttributes>,
    JobMonitoringDataArchiveAttributes {}
export type JobMonitoringDataArchiveModel =
  ModelCtor<JobMonitoringDataArchiveInstance>;
export const JobMonitoringDataArchive: JobMonitoringDataArchiveModel;

export interface LandingZoneMonitoringAttributes {
  id: string;
  applicationId: string;
  monitoringName: string;
  isActive: boolean;
  lzMonitoringType: 'fileCount' | 'spaceUsage' | 'fileMovement';
  approvalStatus: 'approved' | 'rejected' | 'pending';
  approvedBy?: string | null;
  approvedAt?: Date | null;
  approverComment?: string | null;
  description: string;
  clusterId: string;
  lastRunDetails?: Record<string, any> | null;
  metaData: Record<string, any>;
  createdBy: string;
  lastUpdatedBy: string;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface LandingZoneMonitoringInstance
  extends
    Model<LandingZoneMonitoringAttributes>,
    LandingZoneMonitoringAttributes {}
export type LandingZoneMonitoringModel =
  ModelCtor<LandingZoneMonitoringInstance>;
export const LandingZoneMonitoring: LandingZoneMonitoringModel;

export interface LicenseAttributes {
  id: string;
  name?: string | null;
  url?: string | null;
  description?: string | null;
}

export interface LicenseInstance
  extends Model<LicenseAttributes>, LicenseAttributes {}
export type LicenseModel = ModelCtor<LicenseInstance>;
export const License: LicenseModel;
export const MonitoringLog: MonitoringLogModel;
export interface MonitoringNotificationAttributes {
  id: string;
  monitoring_type?: string | null;
  monitoring_id?: string | null;
  application_id?: string | null;
  file_name?: string | null;
  notification_reason?: string | null;
  notification_channel?: string | null;
  status?: string | null;
  responded_on?: Date | null;
  metaData?: Record<string, any> | null;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface MonitoringNotificationInstance
  extends
    Model<MonitoringNotificationAttributes>,
    MonitoringNotificationAttributes {}
export type MonitoringNotificationModel =
  ModelCtor<MonitoringNotificationInstance>;
export const MonitoringNotification: MonitoringNotificationModel;
export const MonitoringType: MonitoringTypeModel;

export interface NotificationQueueAttributes {
  id: string;
  type: 'msTeams' | 'email';
  notificationOrigin: string;
  originationId?: string | null;
  deliveryType: 'immediate' | 'scheduled';
  deliveryTime?: Date | null;
  templateName: string;
  lastScanned?: Date | null;
  attemptCount: number;
  reTryAfter?: Date | null;
  failureMessage?: Record<string, any> | null;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  metaData?: Record<string, any> | null;
}

export interface NotificationQueueInstance
  extends Model<NotificationQueueAttributes>, NotificationQueueAttributes {}
export type NotificationQueueModel = ModelCtor<NotificationQueueInstance>;
export const NotificationQueue: NotificationQueueModel;

export interface OrbitBuildsAttributes {
  id: string;
  name: string;
  application_id: string;
  monitoring_id?: string | null;
  type: string;
  wuid: string;
  metaData?: Record<string, any> | null;
  build_id: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface OrbitBuildsInstance
  extends Model<OrbitBuildsAttributes>, OrbitBuildsAttributes {}
export type OrbitBuildsModel = ModelCtor<OrbitBuildsInstance>;
export const OrbitBuilds: OrbitBuildsModel;

export interface OrbitMonitoringAttributes {
  id: string;
  application_id: string;
  name: string;
  cron?: string | null;
  build: string;
  businessUnit: string;
  product: string;
  severityCode: number;
  host: string;
  primaryContact?: string | null;
  secondaryContact?: string | null;
  metaData?: Record<string, any> | null;
  isActive?: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface OrbitMonitoringInstance
  extends Model<OrbitMonitoringAttributes>, OrbitMonitoringAttributes {}
export type OrbitMonitoringModel = ModelCtor<OrbitMonitoringInstance>;
export const OrbitMonitoring: OrbitMonitoringModel;

export interface PasswordResetLinkAttributes {
  id: string;
  userId: string;
  resetLink: string;
  issuedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordResetLinkInstance
  extends Model<PasswordResetLinkAttributes>, PasswordResetLinkAttributes {}
export type PasswordResetLinkModel = ModelCtor<PasswordResetLinkInstance>;
export const PasswordResetLink: PasswordResetLinkModel;

export interface RefreshTokenAttributes {
  id: string;
  userId: string;
  token: string;
  deviceInfo: Record<string, any>;
  iat: Date;
  exp: Date;
  revoked: boolean;
  revokedAt?: Date | null;
  metaData?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface RefreshTokenInstance
  extends Model<RefreshTokenAttributes>, RefreshTokenAttributes {}
export type RefreshTokenModel = ModelCtor<RefreshTokenInstance>;
export const RefreshToken: RefreshTokenModel;

export interface RoleTypeAttributes {
  id: string;
  roleName: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface RoleTypeInstance
  extends Model<RoleTypeAttributes>, RoleTypeAttributes {}
export type RoleTypeModel = ModelCtor<RoleTypeInstance>;
export const RoleType: RoleTypeModel;

export interface SentNotificationAttributes {
  id: string;
  searchableNotificationId: string;
  idempotencyKey?: string | null;
  applicationId?: string | null;
  notifiedAt?: Date | null;
  notificationOrigin: string;
  notificationChannel: string;
  notificationTitle: string;
  notificationDescription?: string | null;
  status: string;
  recipients?: Record<string, any> | null;
  resolutionDateTime?: Date | null;
  comment?: string | null;
  createdBy: { name: string; email: string };
  createdAt: Date;
  updatedBy?: Record<string, any> | null;
  updatedAt: Date;
  deletedAt?: Date | null;
  metaData?: Record<string, any> | null;
}

export interface SentNotificationInstance
  extends Model<SentNotificationAttributes>, SentNotificationAttributes {}
export type SentNotificationModel = ModelCtor<SentNotificationInstance>;
export const SentNotification: SentNotificationModel;
export const WorkUnit: WorkUnitModel;
export const WorkUnitDetails: WorkUnitDetailsModel;
export const WorkUnitException: WorkUnitExceptionModel;

export interface TokenBlackListAttributes {
  id: string;
  exp: number;
}

export interface TokenBlackListInstance
  extends Model<TokenBlackListAttributes>, TokenBlackListAttributes {}
export type TokenBlackListModel = ModelCtor<TokenBlackListInstance>;
export const TokenBlackList: TokenBlackListModel;

export interface UserAttributes {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  hash?: string | null;
  registrationMethod: 'traditional' | 'azure';
  verifiedUser: boolean;
  verifiedAt?: Date | null;
  registrationStatus: 'pending' | 'active' | 'revoked';
  forcePasswordReset: boolean;
  passwordExpiresAt?: Date | null;
  loginAttempts: number;
  accountLocked?: { isLocked: boolean; lockedReason: any[] } | null;
  lastLoginAt?: Date | null;
  lastAccessedAt?: Date | null;
  metaData?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface UserInstance extends Model<UserAttributes>, UserAttributes {}
export type UserModel = ModelCtor<UserInstance>;
export const User: UserModel;
// UserApplication Model
export interface UserApplicationAttributes {
  id: string;
  user_id: string;
  application_id: string;
  user_app_relation: 'created' | 'shared' | 'assigned';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface UserApplicationInstance
  extends Model<UserApplicationAttributes>, UserApplicationAttributes {}
export type UserApplicationModel = ModelCtor<UserApplicationInstance>;
export const UserApplication: UserApplicationModel;

export interface UserArchiveAttributes {
  id: string;
  removedBy: string;
  removedAt: Date;
  firstName: string;
  lastName: string;
  email: string;
  registrationMethod: 'traditional' | 'azure';
  verifiedUser: boolean;
  verifiedAt?: Date | null;
  registrationStatus: 'pending' | 'active' | 'revoked';
  forcePasswordReset: boolean;
  passwordExpiresAt?: Date | null;
  lastLoginAt?: Date | null;
  lastAccessedAt?: Date | null;
  metaData?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserArchiveInstance
  extends Model<UserArchiveAttributes>, UserArchiveAttributes {}
export type UserArchiveModel = ModelCtor<UserArchiveInstance>;
export const UserArchive: UserArchiveModel;

export interface UserRoleAttributes {
  id: string;
  userId: string;
  roleId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface UserRoleInstance
  extends Model<UserRoleAttributes>, UserRoleAttributes {}
export type UserRoleModel = ModelCtor<UserRoleInstance>;
export const UserRole: UserRoleModel;

export interface OrbitProfileMonitoringAttributes {
  id: string;
  applicationId: string;
  monitoringName: string;
  description: string;
  isActive: boolean;
  approvalStatus: 'approved' | 'rejected' | 'pending';
  approvedBy?: string | null;
  approvedAt?: Date | null;
  approverComment?: string | null;
  lastRunDetails?: Record<string, any> | null;
  metaData: Record<string, any>;
  createdBy: string;
  lastUpdatedBy: string;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface OrbitProfileMonitoringInstance
  extends
    Model<OrbitProfileMonitoringAttributes>,
    OrbitProfileMonitoringAttributes {}
export type OrbitProfileMonitoringModel =
  ModelCtor<OrbitProfileMonitoringInstance>;
export const OrbitProfileMonitoring: OrbitProfileMonitoringModel;

export interface OrbitBuildDataAttributes {
  BuildInstanceIdKey: number;
  BuildTemplateIdKey?: number | null;
  Name: string;
  HpccWorkUnit?: string | null;
  DateUpdated?: Date | null;
  Status_Code?: string | null;
  Version?: string | null;
  observed_at: Date;
  stable: boolean;
  stable_at?: Date | null;
  last_analyzed_at?: Date | null;
  monitoring_id?: string | null;
  notification_state?: Record<string, any> | null;
  status_history?: Record<string, any> | null;
  metaData?: Record<string, any> | null;
  processed: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface OrbitBuildDataInstance
  extends Model<OrbitBuildDataAttributes>, OrbitBuildDataAttributes {}
export type OrbitBuildDataModel = ModelCtor<OrbitBuildDataInstance>;
export const OrbitBuildData: OrbitBuildDataModel;
