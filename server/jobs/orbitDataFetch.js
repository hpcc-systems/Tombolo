const logger = require("../config/logger");
const sql = require("mssql");
const models = require("../models");
const plugins = models.plugins;
const orbitBuilds = models.orbitBuilds;
const monitoring_notifications = models.monitoring_notifications;
const notificationTemplate = require("./messageCards/notificationTemplate");
const { notify } = require("../routes/notifications/email-notification");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const dbConfig = {
  server: process.env.ORBIT_DB,
  database: process.env.ORBIT_DB_NAME,
  user: process.env.ORBIT_DB_USER,
  password: process.env.ORBIT_DB_PWD,
  port: parseInt(process.env.ORBIT_DB_PORT),
  trustServerCertificate: true,
};

(async () => {
  try {
    //grab all orbit plugins that are active
    const orbitPlugins = await plugins.findAll({
      where: {
        name: "Orbit",
        active: true,
      },
    });
    const sentNotifications = [];

    if (orbitPlugins?.length) {
      //if there are active plugins, grab new data and send notifications
      orbitPlugins.map(async (plugin) => {
        let application_id = plugin.application_id;

        //connect to db
        await sql.connect(dbConfig);

        const result =
          await sql.query`select TOP 25 * from DimReceiveInstance where SubStatus_Code = 'MEGAPHONE' order by DateUpdated desc`;

        //just grab the rows from result
        let rows = result?.recordset;
        //loop through rows to build notifications and import
        await Promise.all(
          rows.map(async (build) => {
            //check if the build already exists
            let orbitBuild = await orbitBuilds.findOne({
              where: {
                build_id: build.ReceiveInstanceIdKey,
                application_id: application_id,
              },
              raw: true,
            });

            //if it doesn't exist, create it and send a notification
            if (!orbitBuild) {
              //create build
              const newBuild = await orbitBuilds.create({
                application_id: application_id,
                build_id: build.ReceiveInstanceIdKey,
                name: build.FileName,
                metaData: {
                  lastRun: build.DateUpdated,
                  status: build.Status_Code,
                  subStatus: build.SubStatus_Code,
                  workunit: build.HpccWorkUnit,
                  EnvironmentName: build.EnvironmentName,
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
                  monitoring_type: "megaphone",
                });
              }

              // //build and send Teams notification
              if (plugin.metaData.notificationWebhooks) {
                let facts = [
                  { name: newBuild.name },
                  { Status: newBuild.metaData.status },
                  { "Sub Status": newBuild.metaData.subStatus },
                  { "Last Run": newBuild.metaData.lastRun },
                  { WorkUnit: newBuild.metaData.workunit },
                ];
                let title = "Orbit Build Detectd With Megaphone Status";
                notification_id = uuidv4();
                const cardBody = notificationTemplate.orbitBuildMessageCard(
                  title,
                  facts,
                  notification_id
                );

                await axios.post(
                  plugin.metaData.notificationWebhooks,
                  JSON.parse(cardBody)
                );

                sentNotifications.push({
                  id: notification_id,
                  status: "notified",
                  notifiedTo: plugin.metaData.notificationWebhooks,
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
        return;
      });
    } else {
      logger.info("No active Orbit Plugins found.");
    }
  } catch (error) {
    logger.error("Error while running Orbit Jobs: " + error);
  }
})();
