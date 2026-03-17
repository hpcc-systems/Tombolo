const path = require('path');
const fs = require('fs');

// Look for .env in Tombolo root folder
const tomboloRootENV = path.join(__dirname, '..', '..', '.env');
const serverENV = path.join(__dirname, '..', '..', 'server', '.env');
const ENVPath = fs.existsSync(tomboloRootENV) ? tomboloRootENV : serverENV;

require('dotenv').config({ path: ENVPath });

const logger = require('./logger.cjs');

// Common database configuration options
const commonDbConfigOptions = {
  dialect: 'mysql',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_seeders',
  migrationStorageTableName: 'sequelize_migrations',
  logging: msg => {
    if (typeof msg === 'string' && msg.startsWith('==')) {
      logger.info(msg);
    } else {
      logger.debug(msg);
    }
  }, // only log migration/seeder status, not SQL queries
};

// SSL configuration if enabled
const sslConfig =
  process.env.MYSQL_SSL_ENABLED === 'true'
    ? {
        ssl: true,
        dialectOptions: {
          ssl: {
            require: true,
          },
        },
      }
    : {};

// Development environment configuration
const development = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOSTNAME,
  ...commonDbConfigOptions,
  ...sslConfig,
};

// Production environment configuration
const production = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOSTNAME,
  ...commonDbConfigOptions,
  ...sslConfig,
};

// Test environment configuration
const test = {
  ...commonDbConfigOptions,
  username: process.env.TEST_DB_USERNAME,
  password: process.env.TEST_DB_PASSWORD,
  database: process.env.TEST_DB_NAME,
  host: process.env.TEST_DB_HOSTNAME,
  logging: false,
};

module.exports = {
  development,
  production,
  test,
};
