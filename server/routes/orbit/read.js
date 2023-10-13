const models = require("../../models");
const orbitBuilds = models.orbitBuilds;
const orbitMonitoring = models.orbitMonitoring;
const express = require("express");
const { param, body, validationResult } = require("express-validator");
const { Op } = require("sequelize");
const moment = require("moment");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const rootENV = path.join(process.cwd(), "..", ".env");
const serverENV = path.join(process.cwd(), ".env");
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
const validatorUtil = require("../../utils/validator");
const monitoring_notifications = models.monitoring_notifications;
const notificationTemplate = require("../../jobs/messageCards/notificationTemplate");
const { notify } = require("../notifications/email-notification");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const sql = require("mssql");
const dbConfig = {
  server: process.env.ORBIT_DB,
  database: process.env.ORBIT_DB_NAME,
  user: process.env.ORBIT_DB_USER,
  password: process.env.ORBIT_DB_PWD,
  port: parseInt(process.env.ORBIT_DB_PORT),
  trustServerCertificate: true,
};

require("dotenv").config({ path: ENVPath });

//create one
router.post(
  "/",
  [
    body("application_id").isUUID(4).withMessage("Invalid application id"),
    body("cron").custom((value) => {
      const valArray = value.split(" ");
      if (valArray.length > 5) {
        throw new Error(
          `Expected number of cron parts 5, received ${valArray.length}`
        );
      } else {
        return Promise.resolve("Good to go");
      }
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      //  TODO transform data before sending in for easier updates
      let newBuildData = {
        application_id: req.body.application_id,
        cron: req.body.cron,
        name: req.body.name,
        build: req.body.build,
        metaData: req.body.metaData,
        isActive: req.body.metaData.monitoringActive,
      };

      const newOrbitMonitoring = await orbitMonitoring.create(newBuildData);

      res.status(201).send(newOrbitMonitoring);

      // const { monitoringActive } = req.body;
      // let monitoringAssetType = "orbitBuilds";

      // //Add monitoring to bree if start monitoring now is checked
      // if (monitoringActive) {
      //   const schedularOptions = {
      //     filemonitoring_id: newSuperFile.id,
      //     name: newSuperFile.name,
      //     cron: newSuperFile.cron,
      //     monitoringAssetType,
      //   };

      //   jobScheduler.scheduleFileMonitoringBreeJob(schedularOptions);
      // }
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Unable to save file monitoring details" });
    }
  }
);

//get all monitorings
router.get(
  "/allMonitorings/:application_id",
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
      const result = await orbitMonitoring.findAll({
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

//get all
router.get(
  "/all/:application_id",
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

router.get(
  "/search/:application_id/:keyword",
  [param("application_id").isUUID(4).withMessage("Invalid application id")],
  [
    param("keyword")
      .matches(/^[a-zA-Z0-9_.\-:\*\?]*$/)
      .withMessage("Invalid keyword"),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { application_id, keyword } = req.params;
      if (!application_id) throw Error("Invalid app ID");

      //connect to db
      await sql.connect(dbConfig);

      const query = `select Name from DimBuildInstance where Name like '%${keyword}%' and Name not like 'Scrub%' and EnvironmentName = 'Insurance' order by  Name asc`;

      const result = await sql.query(query);

      const uniqueNames = [];

      const unique = result.recordset.filter((element) => {
        const isDuplicate = uniqueNames.includes(element.Name);

        if (!isDuplicate) {
          uniqueNames.push(element.Name);

          return true;
        }

        return false;
      });

      res.json(unique);
    } catch (err) {
      // ... error checks

      console.log(err);
      res
        .status(400)
        .send("There was an issue contacting the orbit reports server");
    }
  }
);

/* get single build */
router.get(
  "/getOrbitBuildDetails/:buildName",

  async (req, res) => {
    // const errors = validationResult(req).formatWith(
    //   validatorUtil.errorFormatter
    // );
    try {
      // if (!errors.isEmpty())
      //   return res.status(422).json({ success: false, errors: errors.array() });

      const { buildName } = req.params;

      //connect to db
      await sql.connect(dbConfig);

      const query = `select Top 1 EnvironmentName, Name, Status_DateCreated, HpccWorkUnit, Status_Code, Substatus_Code, BuildInstanceIdKey  from DimBuildInstance where Name = '${buildName}' order by Status_DateCreated desc`;

      const result = await sql.query(query);

      res.json(result?.recordset[0]);
    } catch (err) {
      // ... error checks

      console.log(err);
      res
        .status(400)
        .send("There was an issue contacting the orbit reports server");
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

      //connect to db
      await sql.connect(dbConfig);

      const result =
        await sql.query`select TOP 1 * from DimBuildInstance where SubStatus_Code = 'MEGAPHONE' order by DateUpdated desc`;
      const sentNotifications = [];
      //just grab the rows from result
      let rows = result?.recordset;
      //loop through rows to build notifications and import
      await Promise.all(
        rows.map(async (build) => {
          //check if the build already exists
          let orbitBuild = await orbitBuilds.findOne({
            where: {
              build_id: build.BuildInstanceIdKey,
              application_id: application_id,
            },
            raw: true,
          });

          //if it doesn't exist, create it and send a notification
          if (!orbitBuild) {
            //create build
            const newBuild = await orbitBuilds.create({
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

            //if megaphone, send notification
            // if (build.SubStatus_Code === "MEGAPHONE")

            //build and send email notification
            if (plugin.metaData.notificationEmails) {
              let buildDetails = {
                name: newBuild.name,
                status: newBuild.metaData.status,
                subStatus: newBuild.metaData.subStatus,
                lastRun: newBuild.metaData.lastRun,
                workunit: newBuild.metaData.workunit,
              };

              const emailBody =
                notificationTemplate.orbitBuildEmailBody(buildDetails);
              const emailRecipients = plugin.metaData.notificationEmails;

              const notificationResponse = await notify({
                to: emailRecipients,
                from: process.env.EMAIL_SENDER,
                subject:
                  "Alert: Megaphone Substatus detected on Orbit Build " +
                  build.Name,
                text: emailBody,
                html: emailBody,
              });

              let notification_id = uuidv4();

              sentNotifications.push({
                id: notification_id,
                status: "notified",
                notifiedTo: emailRecipients,
                notification_channel: "eMail",
                application_id,
                notification_reason: "Megaphone Substatus",
                monitoring_id: newBuild.id,
                monitoring_type: "orbit",
              });
            }

            // //build and send Teams notification
            if (plugin.metaData.notificationWebhooks) {
              let facts = [
                { name: newBuild.name },
                { status: newBuild.metaData.status },
                { subStatus: newBuild.metaData.subStatus },
                { lastRun: newBuild.metaData.lastRun },
                { workunit: newBuild.metaData.workunit },
              ];
              let title = "Orbit Build Detectd With Megaphone Status";
              notification_id = uuidv4();
              const cardBody = notificationTemplate.orbitBuildMessageCard(
                title,
                facts,
                notification_id
              );
              await axios.post(plugin.metaData.notificationWebhooks, cardBody);

              sentNotifications.push({
                id: notification_id,
                status: "notified",
                notifiedTo: emailRecipients,
                notification_channel: "msTeams",
                application_id,
                notification_reason: "Megaphone Substatus",
                monitoring_id: newBuild.id,
                monitoring_type: "orbit",
              });
            }
          }

          return true;
        })
      );

      // Record notifications
      if (sentNotifications.length > 0) {
        monitoring_notifications.bulkCreate(sentNotifications);
      }

      res.status(200).send(result);
    } catch (err) {
      // ... error checks

      console.log(err);
      res
        .status(400)
        .send("There was an issue contacting the orbit reports server");
    }
  }
);
module.exports = router;
