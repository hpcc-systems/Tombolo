import path from 'path';
import fs from 'fs';
import { vi } from 'vitest';

// Set NODE_ENV to test BEFORE any other modules are loaded
process.env.NODE_ENV = 'test';

const rootENV = path.join(process.cwd(), '..', '.env');
const serverENV = path.join(process.cwd(), '.env');
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
import dotenv from 'dotenv';
dotenv.config({ path: ENVPath });

global.console = {
  ...console,
  // uncomment to ignore a specific log level
  log: vi.fn(() => {}),
  debug: vi.fn(() => {}),
  info: vi.fn(() => {}),
  // warn: vi.fn(() => {}),
  error: vi.fn(() => {}),
};

vi.mock('worker_threads', () => ({
  parentPort: {
    postMessage: vi.fn(),
  },
}));

// Replace all calls of models to simulate database interactions
vi.mock('../models/index.js', () => {
  const commit = vi.fn();
  const rollback = vi.fn();
  const transaction = vi.fn(() => Promise.resolve({ commit, rollback }));

  return {
    TokenBlackList: {
      findAll: vi.fn(),
    },
    Integration: {
      findOne: vi.fn(),
    },
    AsrDomain: {
      findOne: vi.fn(),
      findByPk: vi.fn(),
    },
    AsrProduct: {
      findOne: vi.fn(),
      findByPk: vi.fn(),
    },
    User: {
      findAll: vi.fn(),
      findOne: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      bulkCreate: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
      save: vi.fn(),
      toJSON: vi.fn(),
      handleDelete: vi.fn(),
    },
    RefreshToken: {
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      bulkCreate: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
    },
    NotificationQueue: {
      create: vi.fn(),
      findOne: vi.fn(),
      findAll: vi.fn(),
    },
    SentNotification: {
      create: vi.fn(),
      findOne: vi.fn(),
      findAll: vi.fn(),
    },
    AccountVerificationCode: {
      create: vi.fn(),
      findOne: vi.fn(),
    },
    PasswordResetLink: {
      create: vi.fn(),
      findOne: vi.fn(),
    },
    InstanceSettings: {
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
    },
    Cluster: {
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      bulkCreate: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
      handleDelete: vi.fn(),
    },
    MonitoringType: {
      findOne: vi.fn(),
      findAll: vi.fn(),
    },
    MonitoringLog: {
      findOne: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    LandingZoneMonitoring: {
      findAll: vi.fn(),
      findOne: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      bulkCreate: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
      handleDelete: vi.fn(),
    },
    ClusterMonitoring: {
      findAll: vi.fn(),
      findOne: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      bulkCreate: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
      handleDelete: vi.fn(),
    },
    CostMonitoring: {
      findAll: vi.fn(),
      findOne: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      bulkCreate: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
      handleDelete: vi.fn(),
      sequelize: {
        transaction,
        __commit: commit, // Expose for test access
        __rollback: rollback, // Expose for test access
      },
    },
    CostMonitoringData: {
      findAll: vi.fn(),
      findOne: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      getClusterDataTotals: vi.fn(),
      getDataTotals: vi.fn(),
    },
    OrbitProfileMonitoring: {
      findAll: vi.fn(),
      findOne: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      bulkCreate: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
      handleDelete: vi.fn(),
      sequelize: {
        transaction,
        __commit: commit,
        __rollback: rollback,
      },
    },
    WorkUnit: {
      findAll: vi.fn(),
      findOne: vi.fn(),
      findAndCountAll: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      bulkCreate: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
      handleDelete: vi.fn(),
      sequelize: {
        transaction,
        __commit: commit,
        __rollback: rollback,
      },
    },
    WorkUnitDetails: {
      findAll: vi.fn(),
      findOne: vi.fn(),
      findAndCountAll: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      bulkCreate: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
      handleDelete: vi.fn(),
      sequelize: {
        transaction,
        __commit: commit,
        __rollback: rollback,
      },
    },
    UserArchive: {
      create: vi.fn(),
    },
    sequelize: {
      transaction,
      literal: jest.fn(value => value),
      __commit: commit, // Expose for test access
      __rollback: rollback, // Expose for test access
    },
  };
});

// Replace all calls of logger with empty function to ensure no tests are logged
vi.mock('winston', () => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
    add: vi.fn(),
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    transports: {
      Console: vi.fn(),
      DailyRotateFile: vi.fn(),
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
      uncolorize: vi.fn(),
      printf: vi.fn(),
      errors: vi.fn(),
    },
  };
});

// Mock winston-daily-rotate-file
vi.mock('winston-daily-rotate-file', () => vi.fn());
