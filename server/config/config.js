const path = require('path');
const fs = require('fs');
const rootENV = path.join(process.cwd(), '..', '.env');
const serverENV = path.join(process.cwd(), '.env');
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
require('dotenv').config({ path: ENVPath});

const logger = require('./logger');
const dbConfigOptions = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOSTNAME,
  dialect: "mysql",
  seedStorage: "sequelize",
  logging: (msg) => logger.debug(msg), // change winston settings to 'debug' to see this log
};

if(process.env.MYSQL_SSL_ENABLED === "true"){
   dbConfigOptions.ssl = true;
   dbConfigOptions.dialectOptions = {
      ssl: {
          require: true
       }
   }
}

module.exports = {
  development: dbConfigOptions,
  production: dbConfigOptions
};
