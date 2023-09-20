// const { parentPort } = require("worker_threads");
const logger = require("../config/logger");
const models = require("../models");
const plugins = models.plugins;
const orbitBuilds = models.orbitBuilds;
const notificationTemplate = require("./messageCards/notificationTemplate");
const { notify } = require("../routes/notifications/email-notification");
const sql = require("msnodesqlv8");
const { v4: uuidv4 } = require("uuid");

// const { log, dispatch } = require("./workerUtils")(parentPort);

(async () => {
  try {
    //grab all orbit plugins that are active
    const orbitPlugins = await plugins.findAll({
      where: {
        name: "Orbit",
        active: true,
      },
    });

    if (orbitPlugins) {
      //if there are active plugins, grab new data and send notifications
      orbitPlugins.map(async (plugin) => {
        let application_id = plugin.application_id;
        const connectionString =
          "server=ALAWDSQL201.RISK.REGN.NET,50265;Database=ORBITReport;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}";
        const query =
          "select TOP 5 * from DimBuildInstance where SubStatus_Code = 'MEGAPHONE' order by DateUpdated desc";
        sql.query(connectionString, query, (err, rows) => {
          if (!err) {
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

                const sentNotifications = [];
                //if megaphone, send notification
                // if (build.SubStatus_Code === "MEGAPHONE")

                //build and send email notification
                if (plugin.metaData.notificationEmails) {
                  let buildDetails = {
                    name: build.Name,
                    status: build.Status_Code,
                    subStatus: build.SubStatus_Code,
                    lastRun: build.LastInfaRunDate,
                    workunit: build.HpccWorkUnit,
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
                  logger.verbose(notificationResponse);
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

                //build and send Teams notification
                if (plugin.metaData.notificationWebhooks) {
                  let facts = {
                    name: build.Name,
                    status: build.Status,
                    subStatus: build.SubStatus_Code,
                    lastRun: build.DateUpdated,
                    workunit: build.HpccWorkUnit,
                  };
                  let title = "Orbit Build Detectd With Megaphone Status";
                  notification_id = uuidv4();
                  const cardBody =
                    notificationTemplate.orbitBuildMessageCardMessageCard(
                      title,
                      [...facts],
                      notification_id
                    );
                  await axios.post(
                    plugin.metaData.notificationWebhooks,
                    cardBody
                  );

                  sentNotifications.push({
                    id: notification_id,
                    status: "notified",
                    notifiedTo: plugin.metaData.notificationWebhooks,
                    notification_channel: "msTeams",
                    application_id,
                    notification_reason: notificationDetails.title,
                    monitoring_id: clusterMonitoring_id,
                    monitoring_type: "cluster",
                  });
                }
              }

              // Record notification and update cluster monitoring
              if (sentNotifications.length > 0) {
                await monitoring_notifications.bulkCreate(sentNotifications);
              }
            });
          }
        });
      });
    } else {
      logger.info("No active Orbit Plugins found.");
    }
  } catch (error) {
    logger.error("Error while running Orbit Jobs: " + error);
  }
})();
