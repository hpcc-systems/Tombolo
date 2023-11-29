const axios = require("axios");
const { notify } = require("../routes/notifications/email-notification");
const { parentPort, workerData } = require("worker_threads");
const logger = require("../config/logger");
const models = require("../models");
const orbitMonitoring = models.orbitMonitoring;
const hpccUtil = require("../utils/hpcc-util");
const { v4: uuidv4 } = require("uuid");
const monitoring_notifications = models.monitoring_notifications;
const {
  emailBody,
  messageCardBody,
} = require("./messageCards/notificationTemplate");
const { update } = require("lodash");

const sql = require("mssql");

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
    const orbitMonitoringDetails = await orbitMonitoring.findOne({
      where: { id: workerData.id },
      raw: true,
    });

    const {
      id,
      name,
      cron,
      build,
      isActive,
      severityCode,
      application_id,
      metaData: {
        lastWorkUnit,
        notifications,
        monitoringCondition,
        monitoringCondition: { notifyCondition },
      },
    } = orbitMonitoringDetails;

    //get most recent WorkUnits

    const query = `select Top 1 HpccWorkUnit as 'WorkUnit', Name as 'Build', DateUpdated as 'Date', Status_Code as 'Status' from DimBuildInstance where Name = '${Build}' order by Date desc`;

    const wuResult = await runSQLQuery(query);

    if (wuResult.err) {
      throw Error(result.message);
    }

    // Keep track of changes
    const metaDifference = [];

    if (wuResult && !wuResult.recordset) {
      //store recent details to check against
      let recentDetails = wuResult.recordset;

      if (notifyCondition.includes("buildStatus")) {
        let newStatus = wuResult.recordset[0].Status;
        let oldStatus = monitoringCondition.buildStatus;

        if (newStatus !== oldStatus) {
          metaDifference.push({
            attribute: "Build Status",
            oldValue: `${oldStatus}`,
            newValue: `${newStatus}`,
          });
        }
      }

      if (notifyCondition.includes("updateInterval")) {
        //update interval is in days, so multiply by 86400000 to get number of milliseconds between updates
        let updateInterval = monitoringCondition.updateInterval;
        let updateIntervalDays = monitoringCondition.updateIntervalDays;

        // let orbit = await hpccUtil.getorbit(clusterid, Name);

        // let newModified = orbit.modified;

        //dates to check update interval
        const lastDate = new Date(modified);
        const newDate = new Date(newModified);
        const currentDate = new Date();

        //get integer difference of days
        const diffInMilliseconds = Math.abs(newDate - lastDate);
        const diffDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24));

        //get integer difference of days to current date
        const diffInMilliCurrent = Math.abs(currentDate - lastDate);
        const diffDaysCurrent = Math.ceil(
          diffInMilliCurrent / (1000 * 60 * 60 * 24)
        );

        //if difference in days !== update interval, and the Orbit Build has been updated, notify
        if (diffDays !== updateInterval && diffDays !== 0) {
          metaDifference.push({
            attribute: "Orbit Build did not follow update schedule",
            oldValue: `${updateInterval} - days defined between updates`,
            newValue: `${diffDays} - days between last updates`,
          });
        }

        //if current amount of days is > defined
        if (diffDaysCurrent > updateInterval) {
          metaDifference.push({
            attribute: "Orbit Build is overdue for update",
            oldValue: `${updateInterval} - days defined between updates`,
            newValue: `${diffDaysCurrent} - days since last update`,
          });
        }
        //if updateIntervalDays is set, check that most recent modified day of the week matches setting
        if (updateIntervalDays?.length) {
          const daysOfWeek = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          const newDate = new Date(newModified);
          const newDayUpdated = daysOfWeek[newDate.getDay()];

          if (!updateIntervalDays.includes(newDayUpdated)) {
            metaDifference.push({
              attribute:
                "Orbit Build was updated on a day of the week not defined",
              oldValue: `${updateIntervalDays} - days defined`,
              newValue: `${newDayUpdated} - day updated`,
            });
          }
        }
      }

      // update orbit monitoring last monitored date
      const date = new Date();
      const currentTimeStamp = date.getTime();
      metaData.lastMonitored = currentTimeStamp;

      await orbitMonitoring.update({ metaData }, { where: { id } });
    }

    // Check what notification channel is set up
    let emailNotificationDetails;
    let teamsNotificationDetails;

    // notifications.channel === "eMail"

    for (let notification of notifications) {
      if (notification.channel === "eMail") {
        emailNotificationDetails = notification;
      }
      if (notification.channel === "msTeams") {
        teamsNotificationDetails = notification;
      }
    }

    const sentNotifications = [];

    if (metaDifference.length > 0) {
      // Note - this does not cover Orbit Build size not in range
      notificationDetails.value =
        "Orbit Build alert has been triggered by Tombolo";
      notificationDetails.title = `Orbit Build alert has been triggered by Tombolo`;
      notificationDetails.text = `Orbit Build alert has been triggered by Tombolo`;
    }

    const notification_id = uuidv4();
    // E-mail notification
    if (emailNotificationDetails && notificationDetails.text) {
      try {
        const body = emailBody(notificationDetails, metaDifference);
        const notificationResponse = await notify({
          to: emailNotificationDetails.recipients,
          from: process.env.EMAIL_SENDER,
          subject: notificationDetails.title,
          text: body,
          html: body,
        });

        if (notificationResponse.accepted) {
          sentNotifications.push({
            id: notification_id,
            file_name: Build,
            monitoring_type: "orbit",
            status: "notified",
            notifiedTo: emailNotificationDetails.recipients,
            notification_channel: "eMail",
            application_id,
            notification_reason: notificationDetails.value,
            monitoring_id: id,
          });
        }
      } catch (err) {
        logger.error(err);
      }
    }

    // Teams notification
    if (teamsNotificationDetails && notificationDetails.text) {
      const { recipients } = teamsNotificationDetails;
      for (let recipient of recipients) {
        try {
          let body = messageCardBody({
            notificationDetails: notificationDetails,
            notification_id,
            id,
            metaDifference,
          });

          await axios.post(recipient, body);

          sentNotifications.push({
            id: notification_id,
            file_name: Build,
            monitoring_type: "orbit",
            status: "notified",
            notifiedTo: teamsNotificationDetails.recipients,
            notification_channel: "msTeams",
            application_id,
            notification_reason: notificationDetails.value,
            monitoring_id: id,
          });
        } catch (err) {
          logger.error(err);
        }
      }
    }

    // Add sent notifications to notification table
    if (sentNotifications.length > 0) {
      try {
        await monitoring_notifications.bulkCreate(sentNotifications);
      } catch (err) {
        logger.error(err);
      }
    }
  } catch (err) {
    logger.error(err);
  } finally {
    parentPort ? parentPort.postMessage("done") : process.exit(0);
  }
})();
