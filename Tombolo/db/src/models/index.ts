import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Import all models
import { AccountVerificationCode } from './AccountVerificationCode.js';
import { Application } from './Application.js';
import { AsrDomain } from './AsrDomain.js';
import { AsrDomainToProductsRelation } from './AsrDomainToProductsRelation.js';
import { AsrMonitoringTypeToDomainsRelation } from './AsrMonitoringTypeToDomainsRelation.js';
import { AsrProduct } from './AsrProduct.js';
import { Cluster } from './Cluster.js';
import { ClusterMonitoring } from './ClusterMonitoring.js';
import { CostMonitoring } from './CostMonitoring.js';
import { CostMonitoringData } from './CostMonitoringData.js';
import { FileMonitoring } from './FileMonitoring.js';
import { InstanceSettings } from './InstanceSettings.js';
import { Integration } from './Integration.js';
import { IntegrationMapping } from './IntegrationMapping.js';
import { JobMonitoring } from './JobMonitoring.js';
import { JobMonitoringData } from './JobMonitoringData.js';
import { JobMonitoringDataArchive } from './JobMonitoringDataArchive.js';
import { LandingZoneMonitoring } from './LandingZoneMonitoring.js';
import { License } from './License.js';
import { MonitoringLog } from './MonitoringLog.js';
import { MonitoringNotification } from './MonitoringNotification.js';
import { MonitoringType } from './MonitoringType.js';
import { NotificationQueue } from './NotificationQueue.js';
import { OrbitBuildData } from './OrbitBuildData.js';
import { OrbitBuilds } from './OrbitBuilds.js';
import { OrbitMonitoring } from './OrbitMonitoring.js';
import { OrbitProfileMonitoring } from './OrbitProfileMonitoring.js';
import { PasswordResetLink } from './PasswordResetLink.js';
import { RefreshToken } from './RefreshToken.js';
import { RoleType } from './RoleType.js';
import { SentNotification } from './SentNotification.js';
import { TokenBlackList } from './TokenBlackList.js';
import { User } from './User.js';
import { UserApplication } from './UserApplication.js';
import { UserArchive } from './UserArchive.js';
import { UserRole } from './UserRole.js';
import { WorkUnit } from './WorkUnit.js';
import { WorkUnitDetails } from './WorkUnitDetails.js';
import { WorkUnitException } from './WorkUnitException.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Look for .env in Tombolo root folder
const tomboloRootENV = path.join(__dirname, '../../..', '.env');
const serverENV = path.join(__dirname, '../../..', 'server', '.env');
const ENVPath = fs.existsSync(tomboloRootENV) ? tomboloRootENV : serverENV;

// Load environment variables
await import('dotenv').then(dotenv => {
  dotenv.config({ path: ENVPath });
});

const env = process.env.NODE_ENV || 'development';

// Dynamically import config (it's still CommonJS)
const configModule = await import('../../config/config.cjs');
const config = configModule.default?.[env] || configModule[env];

// Initialize Sequelize with TypeScript support
export const sequelize = new Sequelize({
  database: config.database,
  username: config.username,
  password: config.password,
  host: config.host,
  dialect: config.dialect,
  logging: config.logging,
  models: [
    AccountVerificationCode,
    Application,
    AsrDomain,
    AsrDomainToProductsRelation,
    AsrMonitoringTypeToDomainsRelation,
    AsrProduct,
    Cluster,
    ClusterMonitoring,
    CostMonitoring,
    CostMonitoringData,
    FileMonitoring,
    InstanceSettings,
    Integration,
    IntegrationMapping,
    JobMonitoring,
    JobMonitoringData,
    JobMonitoringDataArchive,
    LandingZoneMonitoring,
    License,
    MonitoringLog,
    MonitoringNotification,
    MonitoringType,
    NotificationQueue,
    OrbitBuildData,
    OrbitBuilds,
    OrbitMonitoring,
    OrbitProfileMonitoring,
    PasswordResetLink,
    RefreshToken,
    RoleType,
    SentNotification,
    TokenBlackList,
    User,
    UserApplication,
    UserArchive,
    UserRole,
    WorkUnit,
    WorkUnitDetails,
    WorkUnitException,
  ],
  ...(config.dialectOptions && { dialectOptions: config.dialectOptions }),
  ...(config.ssl && { ssl: config.ssl }),
});

// Export Sequelize for compatibility
export { Sequelize };

// Export all models
export {
  AccountVerificationCode,
  Application,
  AsrDomain,
  AsrDomainToProductsRelation,
  AsrMonitoringTypeToDomainsRelation,
  AsrProduct,
  Cluster,
  ClusterMonitoring,
  CostMonitoring,
  CostMonitoringData,
  FileMonitoring,
  InstanceSettings,
  Integration,
  IntegrationMapping,
  JobMonitoring,
  JobMonitoringData,
  JobMonitoringDataArchive,
  LandingZoneMonitoring,
  License,
  MonitoringLog,
  MonitoringNotification,
  MonitoringType,
  NotificationQueue,
  OrbitBuildData,
  OrbitBuilds,
  OrbitMonitoring,
  OrbitProfileMonitoring,
  PasswordResetLink,
  RefreshToken,
  RoleType,
  SentNotification,
  TokenBlackList,
  User,
  UserApplication,
  UserArchive,
  UserRole,
  WorkUnit,
  WorkUnitDetails,
  WorkUnitException,
};

// Default export with sequelize instance and all models
export default {
  sequelize,
  Sequelize,
  AccountVerificationCode,
  Application,
  AsrDomain,
  AsrDomainToProductsRelation,
  AsrMonitoringTypeToDomainsRelation,
  AsrProduct,
  Cluster,
  ClusterMonitoring,
  CostMonitoring,
  CostMonitoringData,
  FileMonitoring,
  InstanceSettings,
  Integration,
  IntegrationMapping,
  JobMonitoring,
  JobMonitoringData,
  JobMonitoringDataArchive,
  LandingZoneMonitoring,
  License,
  MonitoringLog,
  MonitoringNotification,
  MonitoringType,
  NotificationQueue,
  OrbitBuildData,
  OrbitBuilds,
  OrbitMonitoring,
  OrbitProfileMonitoring,
  PasswordResetLink,
  RefreshToken,
  RoleType,
  SentNotification,
  TokenBlackList,
  User,
  UserApplication,
  UserArchive,
  UserRole,
  WorkUnit,
  WorkUnitDetails,
  WorkUnitException,
};
