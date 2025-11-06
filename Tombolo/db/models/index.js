"use strict";

const Sequelize = require("sequelize");
const env = process.env.NODE_ENV || "development";
const config = require("../config/config.js")[env];

const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable], config)
  : new Sequelize(config.database, config.username, config.password, config);

// Explicitly import all models
const AccountVerificationCodes = require("./AccountVerificationCodes")(
  sequelize,
  Sequelize.DataTypes
);
const ApiKey = require("./ApiKey")(sequelize, Sequelize.DataTypes);
const Application = require("./Application")(sequelize, Sequelize.DataTypes);
const AsrDomain = require("./AsrDomain")(sequelize, Sequelize.DataTypes);
const AsrDomainToProductsRelation = require("./AsrDomainToProductsRelation")(
  sequelize,
  Sequelize.DataTypes
);
const AsrMonitoringTypeToDomainsRelation =
  require("./AsrMonitoringTypeToDomainsRelation")(
    sequelize,
    Sequelize.DataTypes
  );
const AsrProduct = require("./AsrProduct")(sequelize, Sequelize.DataTypes);
const AssetsGroup = require("./AssetsGroup")(sequelize, Sequelize.DataTypes);
const Cluster = require("./Cluster")(sequelize, Sequelize.DataTypes);
const ClusterMonitoring = require("./ClusterMonitoring")(
  sequelize,
  Sequelize.DataTypes
);
const Constraint = require("./Constraint")(sequelize, Sequelize.DataTypes);
const Consumer = require("./Consumer")(sequelize, Sequelize.DataTypes);
const ConsumerObject = require("./ConsumerObject")(
  sequelize,
  Sequelize.DataTypes
);
const ControlsRegulation = require("./ControlsRegulation")(
  sequelize,
  Sequelize.DataTypes
);
const CostMonitoring = require("./CostMonitoring")(
  sequelize,
  Sequelize.DataTypes
);
const CostMonitoringData = require("./CostMonitoringData")(
  sequelize,
  Sequelize.DataTypes
);
const Dataflow = require("./Dataflow")(sequelize, Sequelize.DataTypes);
const DataflowClusterCredential = require("./DataflowClusterCredential")(
  sequelize,
  Sequelize.DataTypes
);
const DataflowVersion = require("./DataflowVersion")(
  sequelize,
  Sequelize.DataTypes
);
const DataType = require("./DataType")(sequelize, Sequelize.DataTypes);
const DirectoryMonitoring = require("./DirectoryMonitoring")(
  sequelize,
  Sequelize.DataTypes
);
const File = require("./File")(sequelize, Sequelize.DataTypes);
const FileMonitoring = require("./FileMonitoring")(
  sequelize,
  Sequelize.DataTypes
);
const FileTemplate = require("./FileTemplate")(sequelize, Sequelize.DataTypes);
const FileTemplateLayout = require("./FileTemplateLayout")(
  sequelize,
  Sequelize.DataTypes
);
const FileValidation = require("./FileValidation")(
  sequelize,
  Sequelize.DataTypes
);
const GithubRepoSetting = require("./GithubRepoSetting")(
  sequelize,
  Sequelize.DataTypes
);
const Group = require("./Group")(sequelize, Sequelize.DataTypes);
const Indexes = require("./Indexes")(sequelize, Sequelize.DataTypes);
const IndexKey = require("./IndexKey")(sequelize, Sequelize.DataTypes);
const IndexPayload = require("./IndexPayload")(sequelize, Sequelize.DataTypes);
const InstanceSettings = require("./InstanceSettings")(
  sequelize,
  Sequelize.DataTypes
);
const IntegrationMapping = require("./IntegrationMapping")(
  sequelize,
  Sequelize.DataTypes
);
const Integrations = require("./Integrations")(sequelize, Sequelize.DataTypes);
const Job = require("./Job")(sequelize, Sequelize.DataTypes);
const JobExecution = require("./JobExecution")(sequelize, Sequelize.DataTypes);
const JobFile = require("./JobFile")(sequelize, Sequelize.DataTypes);
const JobMonitoring = require("./JobMonitoring")(
  sequelize,
  Sequelize.DataTypes
);
const JobMonitoringData = require("./JobMonitoringData")(
  sequelize,
  Sequelize.DataTypes
);
const JobMonitoringDataArchive = require("./JobMonitoringDataArchive")(
  sequelize,
  Sequelize.DataTypes
);
const JobParam = require("./JobParam")(sequelize, Sequelize.DataTypes);
const LandingZoneMonitoring = require("./LandingZoneMonitoring")(
  sequelize,
  Sequelize.DataTypes
);
const License = require("./License")(sequelize, Sequelize.DataTypes);
const MessageBasedJobs = require("./MessageBasedJobs")(
  sequelize,
  Sequelize.DataTypes
);
const MonitoringLog = require("./MonitoringLog")(
  sequelize,
  Sequelize.DataTypes
);
const MonitoringNotification = require("./MonitoringNotification")(
  sequelize,
  Sequelize.DataTypes
);
const MonitoringType = require("./MonitoringType")(
  sequelize,
  Sequelize.DataTypes
);
const NotificationQueue = require("./NotificationQueue")(
  sequelize,
  Sequelize.DataTypes
);
const OrbitBuilds = require("./OrbitBuilds")(sequelize, Sequelize.DataTypes);
const OrbitMonitoring = require("./OrbitMonitoring")(
  sequelize,
  Sequelize.DataTypes
);
const PasswordResetLink = require("./PasswordResetLink")(
  sequelize,
  Sequelize.DataTypes
);
const Query = require("./query")(sequelize, Sequelize.DataTypes);
const QueryField = require("./QueryField")(sequelize, Sequelize.DataTypes);
const RefreshToken = require("./RefreshToken")(sequelize, Sequelize.DataTypes);
const Report = require("./Report")(sequelize, Sequelize.DataTypes);
const RoleType = require("./RoleType")(sequelize, Sequelize.DataTypes);
const Rule = require("./Rule")(sequelize, Sequelize.DataTypes);
const SentNotification = require("./SentNotification")(
  sequelize,
  Sequelize.DataTypes
);
const TeamsHook = require("./TeamsHook")(sequelize, Sequelize.DataTypes);
const TokenBlackList = require("./TokenBlackList")(
  sequelize,
  Sequelize.DataTypes
);
const User = require("./User")(sequelize, Sequelize.DataTypes);
const UserApplication = require("./UserApplication")(
  sequelize,
  Sequelize.DataTypes
);
const UserArchive = require("./UserArchive")(sequelize, Sequelize.DataTypes);
const UserRole = require("./UserRole")(sequelize, Sequelize.DataTypes);

// Build models object using each model's registered name from model.name property
const models = {};
[
  AccountVerificationCodes,
  ApiKey,
  Application,
  AsrDomain,
  AsrDomainToProductsRelation,
  AsrMonitoringTypeToDomainsRelation,
  AsrProduct,
  AssetsGroup,
  Cluster,
  ClusterMonitoring,
  Constraint,
  Consumer,
  ConsumerObject,
  ControlsRegulation,
  CostMonitoring,
  CostMonitoringData,
  Dataflow,
  DataflowClusterCredential,
  DataflowVersion,
  DataType,
  DirectoryMonitoring,
  File,
  FileMonitoring,
  FileTemplate,
  FileTemplateLayout,
  FileValidation,
  GithubRepoSetting,
  Group,
  Indexes,
  IndexKey,
  IndexPayload,
  InstanceSettings,
  IntegrationMapping,
  Integrations,
  Job,
  JobExecution,
  JobFile,
  JobMonitoring,
  JobMonitoringData,
  JobMonitoringDataArchive,
  JobParam,
  LandingZoneMonitoring,
  License,
  MessageBasedJobs,
  MonitoringLog,
  MonitoringNotification,
  MonitoringType,
  NotificationQueue,
  OrbitBuilds,
  OrbitMonitoring,
  PasswordResetLink,
  Query,
  QueryField,
  RefreshToken,
  Report,
  RoleType,
  Rule,
  SentNotification,
  TeamsHook,
  TokenBlackList,
  User,
  UserApplication,
  UserArchive,
  UserRole,
].forEach((model) => {
  models[model.name] = model;
});

// Set up associations
Object.keys(models).forEach((modelName) => {
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
