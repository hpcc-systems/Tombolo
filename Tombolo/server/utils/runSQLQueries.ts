import sql from 'mssql';
import mysql from 'mysql2/promise';
import logger from '../config/logger.js';

interface OrbitDbConfig {
  host: string;
  database: string;
  user: string;
  password: string;
  port: number;
  ssl: {
    minVersion: string;
  };
}

interface FidoDbConfig {
  server: string;
  database: string;
  user: string;
  password: string;
  port: number;
  trustServerCertificate: boolean;
}

const orbitDbConfig: OrbitDbConfig = {
  host: process.env.ORBIT_DB ? process.env.ORBIT_DB : '',
  database: process.env.ORBIT_DB_NAME ? process.env.ORBIT_DB_NAME : '',
  user: process.env.ORBIT_DB_USER ? process.env.ORBIT_DB_USER : '',
  password: process.env.ORBIT_DB_PWD ? process.env.ORBIT_DB_PWD : '',
  port: parseInt(process.env.ORBIT_DB_PORT as string)
    ? parseInt(process.env.ORBIT_DB_PORT as string)
    : 0,
  ssl: { minVersion: 'TLSv1.2' },
};

const fidoDbConfig: FidoDbConfig = {
  server: process.env.FIDO_DB ? process.env.FIDO_DB : '',
  database: process.env.FIDO_DB_NAME ? process.env.FIDO_DB_NAME : '',
  user: process.env.FIDO_DB_USER ? process.env.FIDO_DB_USER : '',
  password: process.env.FIDO_DB_PWD ? process.env.FIDO_DB_PWD : '',
  port: parseInt(process.env.FIDO_DB_PORT as string)
    ? parseInt(process.env.FIDO_DB_PORT as string)
    : 0,
  trustServerCertificate: true,
};

const runMySQLQuery = async (
  query: string,
  config: OrbitDbConfig,
  params: any[] = []
): Promise<any> => {
  const connection = await mysql.createConnection(config);
  connection.connect();
  // If params provided, pass them to query to use prepared values
  const [rows] =
    params && params.length > 0
      ? await connection.query(query, params)
      : await connection.query(query);
  connection.end();
  return rows;
};

const runSQLQuery = async (
  query: string,
  config: FidoDbConfig
): Promise<any> => {
  try {
    await sql.connect(config);

    const result = await sql.query(query);

    //need this close to fix bug where it was only contacting the first server
    sql.close();
    return result;
  } catch (err) {
    logger.error('runSqlQuery: ', err);
    return {
      err,
      message: 'There was an issue contacting the server',
    };
  }
};

export { runMySQLQuery, runSQLQuery, orbitDbConfig, fidoDbConfig };
