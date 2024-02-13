const logger = require("../config/logger");
const sql = require("mssql");
const models = require("../models");
const integrations = models.integrations;
const orbitBuilds = models.orbitBuilds;
const teamsWebhooks = models.teams_hook;
const monitoring_notifications = models.monitoring_notifications;
const notificationTemplate = require("./messageCards/notificationTemplate");
const { notify } = require("../routes/notifications/email-notification");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const {
  runMySQLQuery,
  orbitDbConfig,
} = require("../../utils/runSQLQueries.js");

(async () => {
  try {
    //grab all orbit integrations that are active
    const orbitIntegrations = await integrations.findAll({
      where: {
        name: "Orbit",
        active: true,
      },
    });
    const sentNotifications = [];

    if (!orbitIntegrations.length) return;

    //if there are active integrations, grab new data and send notifications
    orbitIntegrations.map(async (integration) => {
      //if megaphone is not active, stop here and don't run
      if (!integration.config.megaphoneActive) return;

      let application_id = integration.application_id;

      //connect to db
      await sql.connect(dbConfig);

      query = `select TOP 25 * from DimReceiveInstance where SubStatus_Code = 'MEGAPHONE' order by DateUpdated desc`;

      const result = await runMySQLQuery(query, orbitDbConfig);

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
              monitoring_id: null,
              name: build.FileName,
              type: "megaphone",
              wuid: build.HpccWorkUnit,
              metaData: {
                lastRun: build.DateUpdated,
                status: build.Status_Code,
                subStatus: build.SubStatus_Code,
                EnvironmentName: build.EnvironmentName,
                initialStatus: build.Status_Code,
                finalStatus: build.Status_Code,
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
                monitoring_type: "megaphone",
              });
            }

            // //build and send Teams notification
            if (integration?.metaData?.notificationWebhooks) {
              //get the teams webhooks by the ID's in the webhooks
              for (let hook of integration.metaData.notificationWebhooks) {
                let teamsHook = await teamsWebhooks.findOne({
                  where: {
                    id: hook,
                  },
                  raw: true,
                });

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

                await axios.post(teamsHook.url, JSON.parse(cardBody));

                sentNotifications.push({
                  id: notification_id,
                  status: "notified",
                  notifiedTo: teamsHook.url,
                  notification_channel: "msTeams",
                  application_id,
                  notification_reason: "Megaphone Substatus",
                  monitoring_id: newBuild.id,
                  monitoring_type: "orbit",
                });
              }
            }
          } else {
            //if it does exist, update the "final status metadata"

            await orbitBuilds.update(
              {
                metaData: {
                  ...orbitBuild.metaData,
                  finalStatus: build.Status_Code,
                },
              },
              {
                where: {
                  build_id: build.ReceiveInstanceIdKey,
                  application_id: application_id,
                },
              }
            );
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
  } catch (error) {
    logger.error("Error while running Orbit Jobs: " + error);
  }
})();
