require('dotenv').config();
module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'mysql',
    seederStorage: 'json',
   //  "ssl": true,
   //  "dialectOptions": {
   //     "ssl": {
   //        "require": true
   //     }
   //  }
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'mysql',
    seederStorage: 'json',
    "ssl": true,
    "dialectOptions": {
       "ssl": {
          "require": true
       }
    }
  }
};