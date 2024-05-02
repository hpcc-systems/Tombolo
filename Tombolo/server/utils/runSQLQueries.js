const sql = require("mssql");
const mysql = require("mysql2/promise");

const orbitDbConfig = {
  host: process.env.ORBIT_DB,
  database: process.env.ORBIT_DB_NAME,
  user: process.env.ORBIT_DB_USER,
  password: process.env.ORBIT_DB_PWD,
  port: parseInt(process.env.ORBIT_DB_PORT),
  ssl: { minVersion: "TLSv1.2" },
};

const fidoDbConfig = {
  server: process.env.FIDO_DB,
  database: process.env.FIDO_DB_NAME,
  user: process.env.FIDO_DB_USER,
  password: process.env.FIDO_DB_PWD,
  port: parseInt(process.env.FIDO_DB_PORT),
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
      message: "There was an issue contacting the server" + err,
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
    console.log(err);
    return {
      err,
      message: "There was an issue contacting the server",
    };
  }
};

module.exports = {
  runMySQLQuery,
  runSQLQuery,
  orbitDbConfig,
  fidoDbConfig,
};
