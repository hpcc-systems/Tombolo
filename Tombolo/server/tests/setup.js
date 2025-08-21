const path = require('path');
const fs = require('fs');
const rootENV = path.join(process.cwd(), '..', '.env');
const serverENV = path.join(process.cwd(), '.env');
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
require('dotenv').config({ path: ENVPath });

global.console = {
  ...console,
  // uncomment to ignore a specific log level
  log: jest.fn(() => {}),
  debug: jest.fn(() => {}),
  info: jest.fn(() => {}),
  // warn: jest.fn(() => {}),
  error: jest.fn(() => {}),
};

// Replace all calls of models to simulate database interactions
jest.mock('../models', () => {
  const commit = jest.fn();
  const rollback = jest.fn();
  const transaction = jest.fn(() => Promise.resolve({ commit, rollback }));

  return {
    TokenBlackList: {
      findAll: jest.fn(),
    },
    User: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      bulkCreate: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      save: jest.fn(),
      toJSON: jest.fn(),
      handleDelete: jest.fn(),
    },
    RefreshToken: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      bulkCreate: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    },
    NotificationQueue: {
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    },
    SentNotification: {
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    },
    AccountVerificationCode: {
      create: jest.fn(),
      findOne: jest.fn(),
    },
    PasswordResetLink: {
      create: jest.fn(),
      findOne: jest.fn(),
    },
    InstanceSetting: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    },
    Cluster: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      bulkCreate: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      handleDelete: jest.fn(),
    },
    LandingZoneMonitoring: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      bulkCreate: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      handleDelete: jest.fn(),
    },
    ClusterMonitoring: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      bulkCreate: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      handleDelete: jest.fn(),
    },
    CostMonitoring: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      bulkCreate: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      handleDelete: jest.fn(),
      sequelize: {
        transaction,
        __commit: commit, // Expose for test access
        __rollback: rollback, // Expose for test access
      },
    },
    UserArchive: {
      create: jest.fn(),
    },
    sequelize: {
      transaction,
      __commit: commit, // Expose for test access
      __rollback: rollback, // Expose for test access
    },
  };
});

// Replace all calls of logger with empty function to ensure no tests are logged
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    add: jest.fn(),
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    transports: {
      Console: jest.fn(),
      DailyRotateFile: jest.fn(),
    },
    format: {
      combine: jest.fn((...args) => ({ combine: args })), // Return a mock format object
      timestamp: jest.fn(() => ({ timestamp: true })),
      simple: jest.fn(() => ({ simple: true })),
      json: jest.fn(() => ({ json: true })),
      colorize: jest.fn(() => ({
        // Mock colorize to return an object with addColors
        colorize: true,
        addColors: jest.fn(() => ({})), // Mock addColors to return an empty object or as needed
      })),
      uncolorize: jest.fn(),
      printf: jest.fn(),
      errors: jest.fn(),
    },
  };
});

// Mock winston-daily-rotate-file
jest.mock('winston-daily-rotate-file', () => jest.fn());
