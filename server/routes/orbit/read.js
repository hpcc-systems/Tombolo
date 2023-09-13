const models = require("../../models");
const orbitBuilds = models.orbitBuilds;
const express = require("express");
const { param } = require("express-validator");
const { Op } = require("sequelize");
const moment = require("moment");
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

//get all
router.get(
  "/get/:application_id",
  [param("application_id").isUUID(4).withMessage("Invalid application id")],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { application_id } = req.params;
      if (!application_id) throw Error("Invalid app ID");
      const result = await orbitBuilds.findAll({
        where: {
          application_id,
        },
      });

      res.status(200).send(result);
    } catch (err) {
      // ... error checks
      console.log(err);
    }
  }
);

//get filtered orbit builds
router.get("/filteredBuilds", async (req, res) => {
  try {
    const { queryData } = req.query;

    const { status, dateRange, applicationId } = JSON.parse(queryData);

    const query = {
      application_id: applicationId,
      metaData: {
        status: { [Op.in]: status },
      },
    };

    if (dateRange) {
      let minDate = moment(dateRange[0]).format("YYYY-MM-DD HH:mm:ss");
      let maxDate = moment(dateRange[1]).format("YYYY-MM-DD HH:mm:ss");

      const range = [minDate, maxDate];
      query.metaData.lastRun = { [Op.between]: range };
    }

    const results = await orbitBuilds.findAll({
      where: query,
      order: [["metaData.lastRun", "DESC"]],
      raw: true,
    });

    res.status(200).send(results);
  } catch (err) {
    console.error(err);
  }
});

//refresh data, grab new builds
router.post(
  "/updateList:application_id",
  [param("application_id").isUUID(4).withMessage("Invalid application id")],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { application_id } = req.params;
      if (!application_id) throw Error("Invalid app ID");
      const connectionString =
        "server=ALAWDSQL201.RISK.REGN.NET,50265;Database=ORBITReport;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}";
      const query =
        "select TOP 100 * from DimBuildInstance where SubStatus_Code = 'MEGAPHONE' order by DateUpdated desc";
      sql.query(connectionString, query, (err, rows) => {
        rows.map(async (build) => {
          let orbitBuild = await orbitBuilds.findOne({
            where: {
              build_id: build.BuildInstanceIdKey,
              application_id: application_id,
            },
            raw: true,
          });

          if (!orbitBuild) {
            await orbitBuilds.create({
              application_id: application_id,
              build_id: build.BuildInstanceIdKey,
              name: build.Name,
              metaData: {
                lastRun: build.DateUpdated,
                status: build.Status_Code,
                subStatus: build.SubStatus_Code,
                workunit: build.HpccWorkUnit,
                EnvironmentName: build.EnvironmentName,
                Template: build.BuildTemplate_Name,
              },
            });
          }
        });
      });
      res.status(200).send(result);
    } catch (err) {
      // ... error checks
      console.log(err);
    }
  }
);
module.exports = router;
