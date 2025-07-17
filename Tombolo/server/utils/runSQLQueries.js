const sql = require('mssql');
const mysql = require('mysql2/promise');
const logger = require('../config/logger');

const orbitDbConfig = {
  host: process.env.ORBIT_DB ? process.env.ORBIT_DB : '',
  database: process.env.ORBIT_DB_NAME ? process.env.ORBIT_DB_NAME : '',
  user: process.env.ORBIT_DB_USER ? process.env.ORBIT_DB_USER : '',
  password: process.env.ORBIT_DB_PWD ? process.env.ORBIT_DB_PWD : '',
  port: parseInt(process.env.ORBIT_DB_PORT)
    ? parseInt(process.env.ORBIT_DB_PORT)
    : 0,
  ssl: { minVersion: 'TLSv1.2' },
};

const fidoDbConfig = {
  server: process.env.FIDO_DB ? process.env.FIDO_DB : '',
  database: process.env.FIDO_DB_NAME ? process.env.FIDO_DB_NAME : '',
  user: process.env.FIDO_DB_USER ? process.env.FIDO_DB_USER : '',
  password: process.env.FIDO_DB_PWD ? process.env.FIDO_DB_PWD : '',
  port: parseInt(process.env.FIDO_DB_PORT)
    ? parseInt(process.env.FIDO_DB_PORT)
    : 0,
  trustServerCertificate: true,
};

const runMySQLQuery = async (query, config) => {
  try {
    const connection = await mysql.createConnection(config);
    connection.connect();
    const rows = await connection.query(query);
    connection.end();
    return rows;
  } catch (err) {
    return {
      err,
      message: 'There was an issue contacting the server' + err,
    };
  }
};

const runSQLQuery = async (query, config) => {
  try {
    await sql.connect(config);

    const result = await sql.query(query);

    //need this close to fix bug where it was only contacting the first server
    sql.close();
    return result;
  } catch (err) {
    logger.error(err);
    return {
      err,
      message: 'There was an issue contacting the server',
    };
  }
};

module.exports = {
  runMySQLQuery,
  runSQLQuery,
  orbitDbConfig,
  fidoDbConfig,
};
