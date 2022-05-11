require('dotenv').config();
const dbConfigOptions = {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'mysql',
    seederStorage: 'json',
    logging: false
}

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