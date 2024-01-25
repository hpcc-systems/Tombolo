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

const jobScheduler = require("../../job-scheduler");

const sql = require("mssql");
const db = require("../../models");

const dbConfig = {
  server: process.env.ORBIT_DB,
  database: process.env.ORBIT_DB_NAME,
  user: process.env.ORBIT_DB_USER,
  password: process.env.ORBIT_DB_PWD,
  port: parseInt(process.env.ORBIT_DB_PORT),
  trustServerCertificate: true,
};

const fidoDbConfig = {
  server: process.env.FIDO_DB,
  database: process.env.FIDO_DB_NAME,
  user: process.env.FIDO_DB_USER,
  password: process.env.FIDO_DB_PWD,
  port: parseInt(process.env.FIDO_DB_PORT),
  trustServerCertificate: true,
};

const runSQLQuery = async (query, config) => {
  try {
    await sql.connect(config);

    const result = await sql.query(query);

    return result;
  } catch (err) {
    console.log(err);
    return {
      err,
      message: "There was an issue contacting the orbit reports server",
    };
  }
};

require("dotenv").config({ path: ENVPath });

//create one monitoring
//TODO get workunits from past 2 weeks as well in orbitbuilds table
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

      // get last status and WU to store against future checks
      const query = `select TOP 1 HpccWorkUnit as 'WorkUnit', Name as 'Build', DateUpdated as 'Date', Status_Code as 'Status' from DimBuildInstance where Name = '${req.body.build}' order by Date desc`;

      const wuResult = await runSQLQuery(query, dbConfig);

      if (wuResult.err) {
        throw Error(result.message);
      }

      //destructure out of recordset and place inside of new metaData
      const { WorkUnit, Date, Status } = wuResult.recordset[0];

      const metaData = req.body.metaData;

      metaData.lastWorkUnit = {
        lastWorkUnit: WorkUnit,
        lastWorkUnitDate: Date,
        lastWorkUnitStatus: Status,
      };

      //null out isActive in metaData to reduce noise
      metaData.isActive = null;

      // TODO transform data before sending in for easier updates
      let newBuildData = {
        application_id: req.body.application_id,
        cron: req.body.cron,
        name: req.body.name,
        build: req.body.build,
        severityCode: req.body.severityCode,
        product: req.body.product,
        businessUnit: req.body.businessUnit,
        host: req.body.host,
        primaryContact: req.body.primaryContact,
        secondaryContact: req.body.secondaryContact,
        metaData: metaData,
        isActive: req.body.isActive,
      };

      const newOrbitMonitoring = await orbitMonitoring.create(newBuildData);

      const { isActive } = req.body;

      //Add monitoring to bree if start monitoring now is checked
      if (isActive) {
        const schedularOptions = {
          orbitMonitoring_id: newOrbitMonitoring.dataValues.id,
          cron: newOrbitMonitoring.cron,
        };

        jobScheduler.createOrbitMonitoringJob(schedularOptions);
      }

      res.status(201).send(newOrbitMonitoring);
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Unable to save Orbit monitoring details" });
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

//get all builds
router.post("/allBuilds", async (req, res) => {});
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

//get all
router.get(
  "/allMonitoring/:application_id",
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

//search Database for builds with keyword
router.get(
  "/search/:application_id/:keyword",
  [param("application_id").isUUID(4).withMessage("Invalid application id")],
  [
    param("keyword")
      .matches(/^[a-zA-Z0-9_.\-:\*\? ]*$/)
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

      if (!typeof keyword === "string") {
        req.status(400).send("Invalid keyword");
        return;
      }
      const query = `select Name from DimBuildInstance where Name like '%${keyword}%' and Name not like 'Scrub%' and EnvironmentName = 'Insurance' order by  Name asc`;

      const result = await runSQLQuery(query, dbConfig);

      if (result.err) {
        throw Error(result.message);
      }

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

      const query = `select Top 1 EnvironmentName, Name, Status_DateCreated, HpccWorkUnit, Status_Code, Substatus_Code, BuildInstanceIdKey  from DimBuildInstance where Name = '${buildName}' order by Status_DateCreated desc`;

      const result = await runSQLQuery(query, dbConfig);

      if (result.err) {
        throw Error(result.message);
      }

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

//update orbit monitoring
router.put(
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
    try {
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );

      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      const oldInfo = await orbitMonitoring.findOne({
        where: { id: req.body.id },
        raw: true,
      });

      let newInfo = req.body;

      //destructure info out of sent info
      const {
        id,
        name,
        build,
        notifyCondition,
        severityCode,
        product,
        businessUnit,
        host,
        isActive,
        application_id,
        primaryContact,
        secondaryContact,
        cron,
        metaData: { lastMonitored, monitoringCondition },
      } = newInfo;

      //CODEQL FIX
      //-----------------------
      let notificationChannels = req.body.notificationChannels;

      if (!(notificationChannels instanceof Array)) {
        return [];
      }
      //-----------------------

      //build out notifications object for storing inside metadata
      let emails, msTeamsGroups;
      if (notificationChannels.includes("eMail")) {
        emails = newInfo.emails;
      }
      if (notificationChannels.includes("msTeams")) {
        msTeamsGroups = newInfo.msTeamsGroups;
      }

      let notifications = [];

      for (let i = 0; i < notificationChannels.length; i++) {
        if (notificationChannels[i] === "eMail") {
          notifications.push({ channel: "eMail", recipients: emails });
        }
        if (notificationChannels[i] === "msTeams") {
          notifications.push({
            channel: "msTeams",
            recipients: msTeamsGroups,
          });
        }
      }

      //get most recent work unit for storage
      // get last status and WU to store against future checks
      const query = `select TOP 1 HpccWorkUnit as 'WorkUnit', Name as 'Build', DateUpdated as 'Date', Status_Code as 'Status' from DimBuildInstance where Name = '${build}' order by Date desc`;

      const wuResult = await runSQLQuery(query, dbConfig);

      if (wuResult.err) {
        throw Error(result.message);
      }

      //destructure out of recordset and place inside of new metaData
      const { WorkUnit, Date, Status } = wuResult.recordset[0];

      //set data fields
      newInfo = {
        id,
        name,
        cron,
        isActive,
        build,
        severityCode,
        product,
        businessUnit,
        application_id,
        host,
        primaryContact,
        secondaryContact,
        metaData: {
          lastWorkUnit: {
            lastWorkUnit: WorkUnit,
            lastWorkUnitDate: Date,
            lastWorkUnitStatus: Status,
          },
          lastMonitored,
          notifications,
          severityCode,
          monitoringCondition,
        },
      };
      // -------------------------------------------------------
      await orbitMonitoring.update(newInfo, { where: { id } });

      // If start monitoring was changed to TRUE
      if (isActive && oldInfo.isActive === 0) {
        const schedularOptions = {
          orbitMonitoring_id: id,
          cron: newOrbitMonitoring.cron,
        };

        jobScheduler.createOrbitMonitoringJob(schedularOptions);
      }

      // If start monitoring was changed to FALSE
      if (!isActive && oldInfo.isActive === 1) {
        await jobScheduler.removeJobFromScheduler(`Orbit Monitoring - ${id}`);
      }

      // if cron has changed
      if (oldInfo.cron != cron) {
        const allBreeJobs = jobScheduler.getAllJobs();
        const jobName = `Orbit Monitoring - ${id}`;
        for (let job of allBreeJobs) {
          if (job.name === jobName) {
            await jobScheduler.removeJobFromScheduler(jobName);
            await jobScheduler.createOrbitMonitoringJob({
              orbitMonitoring_id: id,

              cron: cron,
            });
          }
        }
      }

      res.status(200).send(newInfo);
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Unable to save orbit build monitoring details" });
    }
  }
);

// Pause or start monitoring
router.put(
  "/togglestatus/:id",
  [param("id").isUUID(4).withMessage("Invalid orbit monitoring Id")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { id } = req.params;
      const monitoring = await orbitMonitoring.findOne({
        where: { id },
        raw: true,
      });
      const { isActive } = monitoring;

      // flipping isActive
      await orbitMonitoring.update(
        { isActive: !isActive },
        { where: { id: id } }
      );

      // If isActive, it is in bre - remove from bree
      if (isActive) {
        await jobScheduler.removeJobFromScheduler(`Orbit Monitoring - ${id}`);
      }

      const name = monitoring.name;
      const cron = monitoring.cron;

      // If isActive = false, add it to bre
      if (!isActive) {
        await jobScheduler.createOrbitMonitoringJob({
          orbitMonitoring_id: id,
          cron: cron,
        });
      }

      res.status(200).send("Update successful");
    } catch (err) {
      console.log(err);
    }
  }
);

//delete
router.delete(
  "/delete/:id/:name",
  [param("id").isUUID(4).withMessage("Invalid orbit monitoring id")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );

      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { id, name } = req.params;
      const response = await orbitMonitoring.destroy({
        where: { id },
      });
      res.status(200).json({ message: `Deleted ${response} orbit monitoring` });

      //Check if this job is in bree - if so - remove
      const breeJobs = jobScheduler.getAllJobs();
      const expectedJobName = `Orbit Monitoring - ${id}`;
      for (job of breeJobs) {
        if (job.name === expectedJobName) {
          jobScheduler.removeJobFromScheduler(expectedJobName);
          break;
        }
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
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

router.get(
  "/:id",
  [param("id").isUUID(4).withMessage("Invalid orbit id")],
  async (req, res) => {
    try {
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );

      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      const { id } = req.params;

      const result = await orbitMonitoring.findOne({
        where: { id },
        raw: true,
      });

      res.status(200).send(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
      console.error(err);
    }
  }
);

router.get(
  "/getWorkunits/:application_id",
  [param("application_id").isUUID(4).withMessage("Invalid application id")],
  async (req, res) => {
    try {
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );

      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      const { application_id } = req.params;

      const result = await orbitMonitoring.findAll({
        where: { application_id },
        raw: true,
      });

      //connect to db

      let wuList = [];

      await Promise.all(
        result.map(async (build) => {
          let wu = await orbitBuilds.findAll({
            where: { application_id, name: build.build },
            raw: true,
          });

          wu.map((wu) => {
            wuList.push(wu);
          });

          Promise.resolve;
        })
      );

      //return finished list;
      res.status(200).send(wuList);
    } catch (err) {
      res.status(500).json({ message: err.message });
      console.error(err);
    }
  }
);

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
            if (integration.metaData.notificationEmails) {
              let buildDetails = {
                name: newBuild.name,
                status: newBuild.metaData.status,
                subStatus: newBuild.metaData.subStatus,
                lastRun: newBuild.metaData.lastRun,
                workunit: newBuild.metaData.workunit,
              };

              const emailBody =
                notificationTemplate.orbitBuildEmailBody(buildDetails);
              const emailRecipients = integration.metaData.notificationEmails;

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
            if (integration.metaData.notificationWebhooks) {
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
              await axios.post(
                integration.metaData.notificationWebhooks,
                cardBody
              );

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

router.get(
  "/getDomains/:application_id",
  [param("application_id").isUUID(4).withMessage("Invalid application id")],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const query =
        "select business_unit from pbi.dim_asr_domain_v where business_unit != 'Unassigned' AND business_unit != 'Not Applicable' order by business_unit asc";
      const result = await runSQLQuery(query, fidoDbConfig);

      if (result?.recordset) {
        res.status(200).send(result.recordset);
      } else {
        throw Error("No domains found on Fido Server: " + query);
      }
    } catch (err) {
      console.log(err);
      res
        .status(400)
        .send("There was an issue contacting the orbit reports server");
    }
  }
);

router.get(
  "/getProducts/:application_id",
  [param("application_id").isUUID(4).withMessage("Invalid application id")],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const query =
        "select product_name from pbi.dim_asr_product_v order by product_name asc";
      const result = await runSQLQuery(query, fidoDbConfig);

      if (result?.recordset) {
        res.status(200).send(result.recordset);
      } else {
        throw Error("No products found on Fido Server: " + query);
      }
    } catch (err) {
      console.log(err);
      res
        .status(400)
        .send("There was an issue contacting the orbit reports server");
    }
  }
);
module.exports = router;
