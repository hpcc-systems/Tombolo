const path = require("path");
const fs = require("fs");
const rootENV = path.join(process.cwd(), "..", ".env");
const serverENV = path.join(process.cwd(), ".env");
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
require("dotenv").config({ path: ENVPath });

const logger = require("./logger");

// Common database configuration options
const commonDbConfigOptions = {
  dialect: "mysql",
  seederStorage: "sequelize",
  seederStorageTableName: "sequelize_seeders",
  migrationStorageTableName: "sequelize_migrations",
  logging: (msg) => logger.debug(msg), // change winston settings to 'debug' to see this log
};

// SSL configuration if enabled
const sslConfig =
  process.env.MYSQL_SSL_ENABLED === "true"
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
