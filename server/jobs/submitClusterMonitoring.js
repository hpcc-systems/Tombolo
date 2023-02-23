const { parentPort, workerData } = require("worker_threads");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const hpccUtil = require("../utils/hpcc-util");
const hpccJSComms = require("@hpcc-js/comms")
const models = require("../models");
const ClusterMonitoring = models.clusterMonitoring;
const monitoring_notifications = models.monitoring_notifications;
const notificationTemplate = require("./messageCards/notificationTemplate")
const { notify } = require("../routes/notifications/email-notification");
const logger = require("../config/logger");

const { log } = require("./workerUtils")(parentPort);

(async () => {
  try {
    const { clusterMonitoring_id } = workerData;

    // Get monitoring details
    const monitoring_details = await ClusterMonitoring.findOne({
      where: { id: clusterMonitoring_id },
      raw: true,
    });

    // If no monitoring found
    if (!monitoring_details) {
      return;
    }

    const {
      cluster_id,
      application_id,
      metaData: { monitoringConditions, monitoring_engines, notifications },
    } = monitoring_details;

    // Get cluster details
    let cluster = await hpccUtil.getCluster(cluster_id);
    const { thor_host, thor_port, username, hash } = cluster;
    const clusterDetails = {
      baseUrl: `${thor_host}:${thor_port}`,
      userID: username || "",
      password: hash || "",
    };

    // Notification
    const notificationDetails = {
      facts: [],
      channels: [],
      engines: [],
      notificationReason: "",
    }; //TODO - Notification reason could be multiple, take that under consideration

    const notificationRecipients = {};
    notifications.forEach((notification) => {
      if (notification.channel === "eMail") {
        notificationRecipients.email = notification.recipients;
      }

      if (notification.channel === "msTeams") {
        notificationRecipients.msTeams = notification.recipients;
      }
    });
    const notificationChannels = Object.keys(notificationRecipients);

    // Iterate over and check if user needs to be notified, if so collect notification details in notificationDetails object
    const { monitorEngineSize } = monitoringConditions;

    //If user wants to monitor engine size
    if (monitorEngineSize) {
      const machineService = new hpccJSComms.MachineService(clusterDetails);
      const targetClusterUsage = await machineService.GetTargetClusterUsageEx(
        monitoring_engines
      );

      const clusterUsage = {};
      targetClusterUsage.forEach(function (details) {
        clusterUsage[details.Name] = details.max;
      });

      monitorEngineSize.forEach((monitoring) => {
        let shouldNotify = false;
        if (monitoring.maxSize <= clusterUsage[monitoring.engine]) {
          const { notified, engine, maxSize } = monitoring;
          notificationChannels.forEach((channel) => {
            if (!notified.includes(channel)) {
              shouldNotify = true;
              notificationDetails.engines.push(engine);
              notificationDetails.notificationReason =
                "Maximum capacity reached";
              if (!notificationDetails.channels.includes(channel)) {
                notificationDetails.channels.push(channel);
              }
            }
          });

          if (shouldNotify) {
            notificationDetails.title = "Urgent : Storage Capacity Reached";
            notificationDetails.facts = [
              ...notificationDetails.facts,
              {
                engine,
                "Maximum Capacity": `${maxSize}%`,
                "Actual Size": `${clusterUsage[monitoring.engine]}%`,
              },
            ];
          }
        }
      });
    }

    //Once notification sent, record on notification table
    const sentNotifications = [];
    
    // Notify via email
    if (
      notificationDetails.title &&
      notificationRecipients.email &&
      notificationDetails.channels.includes("email")
    ) {
      try {
        const { facts, title } = notificationDetails;
        const emailBody =
          notificationTemplate.clusterMonitoringEmailBody(facts);

        const notificationResponse = await notify({
          to: notificationRecipients.email,
          from: process.env.EMAIL_SENDER,
          subject: title,
          text: emailBody,
          html: emailBody,
        });

        logger.verbose(notificationResponse);

        if (notificationResponse.accepted) {
          monitorEngineSize.forEach((monitoring) => {
            if (notificationDetails.engines.includes(monitoring.engine)) {
              monitoring.notified = [...monitoring.notified, "email"];
            }
          });
        }

        const notification_id = uuidv4();

        sentNotifications.push({
          id: notification_id,
          status: "notified",
          notifiedTo: notificationRecipients.email,
          notification_channel: "eMail",
          application_id,
          notification_reason: notificationDetails.title,
          clusterMonitoring_id,
          monitoring_id: clusterMonitoring_id,
          monitoring_type: "Cluster",
        });
      } catch (err) {
        logger.error(err);
      }
    }

    // Notify via msTeams
    if (
      notificationDetails.title &&
      notificationRecipients.msTeams &&
      notificationDetails.channels.includes("msTeams")
    ) {
        const { facts, title } = notificationDetails;
        const recipients = notificationRecipients.msTeams;

         for(let recipient of recipients){
          try{
             const notification_id = uuidv4();
             const cardBody = notificationTemplate.clusterMonitoringMessageCard(
               title,
               [...facts],
               notification_id
             );
             await axios.post(recipient, cardBody);
             monitorEngineSize.forEach((monitoring) => {
               if (notificationDetails.engines.includes(monitoring.engine)) {
                 monitoring.notified = [...monitoring.notified, "msTeams"];
               }
             });

            sentNotifications.push({
              id: notification_id,
              status: "notified",
              notifiedTo: notificationRecipients.email,
              notification_channel: "msTeams",
              application_id,
              notification_reason: notificationDetails.title,
              clusterMonitoring_id,
              monitoring_id: clusterMonitoring_id,
              monitoring_type: "Cluster",
            });
          }catch(err){
            logger.error(err)
          }    
         }
    }

    // Record notification and update cluster monitoring
    if (sentNotifications.length > 0) {
      await monitoring_notifications.bulkCreate(sentNotifications);

    // Successfully notified channels
    sentNotifications.forEach(notification =>{
      monitorEngineSize.forEach(monitoring =>{
       if (
          notificationDetails.engines.includes(monitoring.engine) &&
          !monitoring.notified.includes(notification.notification_channel)
        ) {
          monitoring.notified.push(notification.notification_channel);
        }
      })
    })
  }  

      const currentTimeStamp = Date.now();
      await ClusterMonitoring.update(
        {
          ...monitoring_details,
          metaData : { ...monitoring_details.metaData, last_monitored: currentTimeStamp },
        },
        { where: { id: clusterMonitoring_id } }
      );

    // Reset notified flag
  } catch (err) {
    log("error", "Error in File Monitoring Poller", err);
  } finally {
    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
  }
})();
