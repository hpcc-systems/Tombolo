import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import type { InferAttributes, Options as SequelizeOptions } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

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
import type { WorkUnitExceptionCreationAttributes } from './WorkUnitException.js';

// tsup with shims=true will handle __dirname and import.meta.url correctly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Look for .env in Tombolo root folder
const tomboloRootENV = path.join(__dirname, '../../..', '.env');
const serverENV = path.join(__dirname, '../../..', 'server', '.env');
const ENVPath = fs.existsSync(tomboloRootENV) ? tomboloRootENV : serverENV;

// Load environment variables synchronously
dotenv.config({ path: ENVPath });

const env = process.env.NODE_ENV || 'development';

// Load config synchronously using dynamic require
// The config file is external to the bundle
const loadConfig = () => {
  const require = createRequire(import.meta.url);

  // Try multiple possible paths for the config file
  // __dirname is the dist folder, which could be in the package or in node_modules
  const paths = [
    path.join(__dirname, '..', 'config', 'config.cjs'), // From dist/ to package root (normal case)
    path.join(__dirname, '../..', 'db', 'config', 'config.cjs'), // From node_modules/@tombolo/db/dist
    path.join(__dirname, '../../..', 'Tombolo', 'db', 'config', 'config.cjs'), // From monorepo node_modules
  ];

  let lastError: Error | undefined;

  for (const configPath of paths) {
    try {
      if (fs.existsSync(configPath)) {
        const configModule = require(configPath);
        const config = configModule[env];
        if (config) {
          return config;
        }
      }
    } catch (err) {
      lastError = err as Error;
      // Continue trying other paths
    }
  }

  // If we get here, none of the paths worked
  const errorDetails = [
    `Config file not found or failed to load.`,
    `Environment: ${env}`,
    `__dirname: ${__dirname}`,
    `Tried paths:`,
    ...paths.map((p, i) => `  ${i + 1}. ${p} (exists: ${fs.existsSync(p)})`),
  ];

  if (lastError) {
    errorDetails.push(`Last error: ${lastError.message}`);
  }

  throw new Error(errorDetails.join('\n'));
};

const config = loadConfig();

// Initialize Sequelize with TypeScript support
const sequelizeOptions: SequelizeOptions & { models: any[] } = {
  ...(config.dialectOptions && { dialectOptions: config.dialectOptions }),
  ...(config.ssl && { ssl: config.ssl }),
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
};

export const sequelize = new Sequelize(sequelizeOptions);

// Export Sequelize for compatibility
export { Sequelize };

// Export types
export { WorkUnitExceptionCreationAttributes };

// Export Sequelize types for external use
export type {
  Transaction,
  Op,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

// Export legacy-compatible type aliases
export type MonitoringLogAttributes = InferAttributes<MonitoringLog>;
export type MonitoringLogInstance = MonitoringLog;

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
