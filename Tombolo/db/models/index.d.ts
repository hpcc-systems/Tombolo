import { Sequelize, Model, ModelCtor } from "sequelize";

// Generic model type for models without specific attributes defined yet
export type GenericModel = ModelCtor<Model>;

// Application Model
export interface ApplicationAttributes {
  id: string;
  title: string;
  description: string;
  creator: string;
  visibility: "Public" | "Private";
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface ApplicationInstance
  extends Model<ApplicationAttributes>,
    ApplicationAttributes {}
export type ApplicationModel = ModelCtor<ApplicationInstance>;

// Model exports
export const sequelize: Sequelize;

export const AccountVerificationCodes: GenericModel;
export const Application: ApplicationModel;
export const AsrDomain: GenericModel;
export const AsrDomainToProductsRelation: GenericModel;
export const AsrMonitoringTypeToDomainsRelation: GenericModel;
export const AsrProduct: GenericModel;
export const Cluster: GenericModel;
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
export const MonitoringLog: GenericModel;
export const MonitoringNotification: GenericModel;
export const MonitoringType: GenericModel;
export const NotificationQueue: GenericModel;
export const OrbitBuilds: GenericModel;
export const OrbitMonitoring: GenericModel;
export const PasswordResetLink: GenericModel;
export const RefreshToken: GenericModel;
export const RoleType: GenericModel;
export const SentNotification: GenericModel;
export const TokenBlackList: GenericModel;
export const User: GenericModel;
export const UserApplication: GenericModel;
export const UserArchive: GenericModel;
export const UserRole: GenericModel;
