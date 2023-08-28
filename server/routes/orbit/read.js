const models = require("../../models");
const express = require("express");
// const logger = require("../../config/logger");
// const validatorUtil = require("../../utils/validator");
// const { body, param, validationResult } = require("express-validator");
// const hpccJSComms = require("@hpcc-js/comms");
// const hpccUtil = require("../../utils/hpcc-util");
// const JobScheduler = require("../../job-scheduler");

const router = express.Router();
const path = require("path");
const fs = require("fs");
const rootENV = path.join(process.cwd(), "..", ".env");
const serverENV = path.join(process.cwd(), ".env");
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
// const sql = require("mssql/msnodesqlv8");

// // const { param, validationResult } = require("express-validator");
// // const validatorUtil = require("../../utils/validator");

require("dotenv").config({ path: ENVPath });

// const pool = new sql.ConnectionPool({
//   server: process.env.ORBIT_DB,
//   database: process.env.ORBIT_DB_NAME,
//   port: 50265,
//   driver: "msnodesqlv8",
//   options: {
//     trustedConnection: true,
//     trustServerCertificate: true,
//   },
// });

const sql = require("msnodesqlv8");

router.get("/get", async (req, res) => {
  console.log("Getting Orbit Stuff!!");
  try {
    // // make sure that any items are correctly URL encoded in the connection string
    // await sql.connect(sqlConfig);
    // const result =
    //   await sql.query`select * from DimCompany where CompanyId='14514'`;

    let result = "";
    const connectionString =
      "server=ALAWDSQL201.RISK.REGN.NET,50265;Database=ORBITReport;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}";
    const query =
      "select TOP 10 * from DimBuildInstance where SubStatus_Code = 'MEGAPHONE' order by DateUpdated desc";
    sql.query(connectionString, query, (err, rows) => {
      console.log(err);
      console.log(rows);
    });
    res.status(200).send(result);
  } catch (err) {
    // ... error checks
    console.log(err);
  }
});
module.exports = router;
