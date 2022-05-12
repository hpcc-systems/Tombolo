const logger = require('./logger');

require('dotenv').config();
module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'mysql',
    seederStorage: 'json',
    logging: (msg) => logger.debug(msg), // change winston settings to 'debug' to see this log
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
      },
    },
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    logging: (msg) => logger.debug(msg), // change winston settings to 'debug' to see this log
    dialect: 'mysql',
    seederStorage: 'json',
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
      },
    },
  },
};
