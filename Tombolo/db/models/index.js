'use strict';

const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[env];

const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable], config)
  : new Sequelize(config.database, config.username, config.password, config);

// Explicitly import all models
const AccountVerificationCodes = require('./AccountVerificationCodes')(
  sequelize,
  Sequelize.DataTypes
);
// const ApiKey = require("./ApiKey")(sequelize, Sequelize.DataTypes);
const Application = require('./Application')(sequelize, Sequelize.DataTypes);
const AsrDomain = require('./AsrDomain')(sequelize, Sequelize.DataTypes);
const AsrDomainToProductsRelation = require('./AsrDomainToProductsRelation')(
  sequelize,
  Sequelize.DataTypes
);
const AsrMonitoringTypeToDomainsRelation =
  require('./AsrMonitoringTypeToDomainsRelation')(
    sequelize,
    Sequelize.DataTypes
  );
const AsrProduct = require('./AsrProduct')(sequelize, Sequelize.DataTypes);
const Cluster = require('./Cluster')(sequelize, Sequelize.DataTypes);
const ClusterMonitoring = require('./ClusterMonitoring')(
  sequelize,
  Sequelize.DataTypes
);

const CostMonitoring = require('./CostMonitoring')(
  sequelize,
  Sequelize.DataTypes
);
const OrbitProfileMonitoring = require('./OrbitProfileMonitoring')(
  sequelize,
  Sequelize.DataTypes
);

const CostMonitoringData = require('./CostMonitoringData')(
  sequelize,
  Sequelize.DataTypes
);

const DirectoryMonitoring = require('./DirectoryMonitoring')(
  sequelize,
  Sequelize.DataTypes
);
// const File = require("./File")(sequelize, Sequelize.DataTypes);
const FileMonitoring = require('./FileMonitoring')(
  sequelize,
  Sequelize.DataTypes
);

const InstanceSettings = require('./InstanceSettings')(
  sequelize,
  Sequelize.DataTypes
);
const IntegrationMapping = require('./IntegrationMapping')(
  sequelize,
  Sequelize.DataTypes
);
const Integrations = require('./Integrations')(sequelize, Sequelize.DataTypes);
const JobMonitoring = require('./JobMonitoring')(
  sequelize,
  Sequelize.DataTypes
);
const JobMonitoringData = require('./JobMonitoringData')(
  sequelize,
  Sequelize.DataTypes
);
const JobMonitoringDataArchive = require('./JobMonitoringDataArchive')(
  sequelize,
  Sequelize.DataTypes
);
const LandingZoneMonitoring = require('./LandingZoneMonitoring')(
  sequelize,
  Sequelize.DataTypes
);
const License = require('./License')(sequelize, Sequelize.DataTypes);
const MonitoringLog = require('./MonitoringLog')(
  sequelize,
  Sequelize.DataTypes
);
const MonitoringNotification = require('./MonitoringNotification')(
  sequelize,
  Sequelize.DataTypes
);
const MonitoringType = require('./MonitoringType')(
  sequelize,
  Sequelize.DataTypes
);
const NotificationQueue = require('./NotificationQueue')(
  sequelize,
  Sequelize.DataTypes
);
const OrbitBuilds = require('./OrbitBuilds')(sequelize, Sequelize.DataTypes);
const OrbitMonitoring = require('./OrbitMonitoring')(
  sequelize,
  Sequelize.DataTypes
);
const PasswordResetLink = require('./PasswordResetLink')(
  sequelize,
  Sequelize.DataTypes
);
const RefreshToken = require('./RefreshToken')(sequelize, Sequelize.DataTypes);
const RoleType = require('./RoleType')(sequelize, Sequelize.DataTypes);
const SentNotification = require('./SentNotification')(
  sequelize,
  Sequelize.DataTypes
);
const TokenBlackList = require('./TokenBlackList')(
  sequelize,
  Sequelize.DataTypes
);
const User = require('./User')(sequelize, Sequelize.DataTypes);
const UserApplication = require('./UserApplication')(
  sequelize,
  Sequelize.DataTypes
);
const UserArchive = require('./UserArchive')(sequelize, Sequelize.DataTypes);
const UserRole = require('./UserRole')(sequelize, Sequelize.DataTypes);

// Build models object using each model's registered name from model.name property
const models = {};
[
  AccountVerificationCodes,
  Application,
  AsrDomain,
  AsrDomainToProductsRelation,
  AsrMonitoringTypeToDomainsRelation,
  AsrProduct,
  Cluster,
  ClusterMonitoring,
  CostMonitoring,
  CostMonitoringData,
  OrbitProfileMonitoring,
  DirectoryMonitoring,
  FileMonitoring,
  InstanceSettings,
  IntegrationMapping,
  Integrations,
  JobMonitoring,
  JobMonitoringData,
  JobMonitoringDataArchive,
  LandingZoneMonitoring,
  License,
  MonitoringLog,
  MonitoringNotification,
  MonitoringType,
  NotificationQueue,
  OrbitBuilds,
  OrbitMonitoring,
  PasswordResetLink,
  RefreshToken,
  RoleType,
  SentNotification,
  TokenBlackList,
  User,
  UserApplication,
  UserArchive,
  UserRole,
].forEach(model => {
  models[model.name] = model;
});

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Named exports for all models, plus sequelize and Sequelize
module.exports = {
  sequelize,
  Sequelize,
  ...models,
};
