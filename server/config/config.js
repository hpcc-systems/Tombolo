require('dotenv').config();
module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'mysql'
  },
  production: {
    username: '',
    password: '',
    database: '',
    host: '',
    dialect: 'mysql',
    use_env_variable: 'DATABASE_URL'
  }
};