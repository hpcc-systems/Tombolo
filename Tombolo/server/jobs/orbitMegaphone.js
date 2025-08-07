const logger = require('../config/logger');
const {
  Integration,
  IntegrationMapping,
  orbitBuilds,
  MonitoringNotification,
  notification_queue: notification,
} = require('../models');

const { runMySQLQuery, orbitDbConfig } = require('../utils/runSQLQueries.js');

(async () => {
  try {
    //grab all orbit integrations that are active
    const integrationList = await Integration.findAll({
      where: {
        name: 'ASR',
      },
    });
    const sentNotifications = [];

    const integrationId = integrationList[0].dataValues.id;

    if (!integrationId) return;

    const orbitIntegrations = await IntegrationMapping.findAll({
      where: {
        integration_id: integrationId,
      },
    });

    //if there are active integrations, grab new data and send notifications
    orbitIntegrations.map(async integration => {
      //if megaphone is not active, stop here and don't run
      if (!integration?.dataValues?.metaData?.megaPhoneAlerts?.active) return;

      let application_id = integration.dataValues?.application_id;

      // eslint-disable-next-line quotes
      const query = `select * from orbitreport.DimReceiveInstance where SubStatus_Code = 'MEGAPHONE' order by DateUpdated desc limit 1`;
      const result = await runMySQLQuery(query, orbitDbConfig);

      if (!result[0]) return;

      //loop through rows to build notifications and import
      await Promise.all(
        result[0].map(async build => {
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
              type: 'megaphone',
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

            logger.verbose(
              'orbitBuild Megaphone Email Contacts',
              integration.dataValues.metaData.megaPhoneAlerts.emailContacts
            );

            if (
              integration.dataValues.metaData.megaPhoneAlerts?.emailContacts
            ) {
              //create a notification queue
              await notification.create({
                type: 'email',
                notificationOrigin: 'orbitMegaphone',
                templateName: 'orbitMegaphone',
                deliveryType: 'immediate',
                createdBy: 'orbitMegaphone',
                metaData: {
                  emailDetails: {
                    subject:
                      'Megaphone Substatus detected on Orbit Build ' +
                      newBuild.name,
                    mainRecipients:
                      integration.dataValues.metaData.megaPhoneAlerts
                        .emailContacts,
                    data: newBuild.metaData,
                  },
                },
              });
            }

            //build and send email notification
            // if (integration.metaData.notificationEmails) {
            //   let buildDetails = {
            //     name: newBuild.name,
            //     status: newBuild.metaData.status,
            //     subStatus: newBuild.metaData.subStatus,
            //     lastRun: newBuild.metaData.lastRun,
            //     workunit: newBuild.metaData.workunit,
            //   };

            //   const emailBody =
            //     notificationTemplate.orbitBuildEmailBody(buildDetails);
            //   const emailRecipients = integration.metaData.notificationEmails;

            //   const notificationResponse = await notify({
            //     to: emailRecipients,
            //     from: process.env.EMAIL_SENDER,
            //     subject:
            //       "Alert: Megaphone Substatus detected on Orbit Build " +
            //       build.Name,
            //     text: emailBody,
            //     html: emailBody,
            //   });

            //   let notification_id = uuidv4();

            //   sentNotifications.push({
            //     id: notification_id,
            //     status: "notified",
            //     notifiedTo: emailRecipients,
            //     notification_channel: "eMail",
            //     application_id,
            //     notification_reason: "Megaphone Substatus",
            //     monitoring_id: newBuild.id,
            //     monitoring_type: "megaphone",
            //   });
            // }

            // // //build and send Teams notification
            // if (integration?.metaData?.notificationWebhooks) {
            //   //get the teams webhooks by the ID's in the webhooks
            //   for (let hook of integration.metaData.notificationWebhooks) {
            //     let teamsHook = await teamsWebhooks.findOne({
            //       where: {
            //         id: hook,
            //       },
            //       raw: true,
            //     });

            //     let facts = [
            //       { name: newBuild.name },
            //       { Status: newBuild.metaData.status },
            //       { "Sub Status": newBuild.metaData.subStatus },
            //       { "Last Run": newBuild.metaData.lastRun },
            //       { WorkUnit: newBuild.metaData.workunit },
            //     ];
            //     let title = "Orbit Build Detectd With Megaphone Status";
            //     notification_id = uuidv4();
            //     const cardBody = notificationTemplate.orbitBuildMessageCard(
            //       title,
            //       facts,
            //       notification_id
            //     );

            //     await axios.post(teamsHook.url, JSON.parse(cardBody));

            //     sentNotifications.push({
            //       id: notification_id,
            //       status: "notified",
            //       notifiedTo: teamsHook.url,
            //       notification_channel: "msTeams",
            //       application_id,
            //       notification_reason: "Megaphone Substatus",
            //       monitoring_id: newBuild.id,
            //       monitoring_type: "orbit",
            //     });
            //   }
            // }
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
        await MonitoringNotification.bulkCreate(sentNotifications);
      }
      return;
    });
  } catch (error) {
    logger.error('Error while running Orbit Jobs: ' + error);
  }
})();
