const { parentPort, workerData } = require("worker_threads");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const hpccUtil = require("../utils/hpcc-util");
const logger = require("../config/logger");
const models = require("../models");
const JobMonitoring = models.jobMonitoring;
const cluster = models.cluster;
const Monitoring_notifications = models.monitoring_notifications;
const { notify } = require("../routes/notifications/email-notification");


// E-mail Template -------------------------------------------------
function jobMonitoringEmailBody(data, timeStamp) {
  let tableHTML =
    '<table style="border-collapse: collapse; width: 100%; max-width: 800px" className="sentNotificationTable"> ';

  // Extract name and cluster name
  const { name, clusterName } = data[0];

  // Add name and cluster name as h3 elements
  tableHTML +=
    '<tr><td colspan="2" style="border: 1px solid #D3D3D3; padding: 5px;">';
  tableHTML += "<div>Job name: " + name + "</div>";
  tableHTML += "<div>Cluster: " + clusterName + "</div>";
  tableHTML += "<div>Date/Time: " + timeStamp + "</div>";

  tableHTML += "</td></tr>";

  // Add table headers
  tableHTML += "<tr>";
  tableHTML +=
    '<th style="border: 1px solid #D3D3D3; text-align: left; padding-left: 5px;">WuID</th>';
  tableHTML +=
    '<th style="border: 1px solid #D3D3D3; text-align: left; padding-left: 5px;">Alert(s)</th>';
  tableHTML += "</tr>";

  // Iterate over each object in the data array
  data.forEach((obj) => {
    // Extract object properties
    const { wuId, issues } = obj;

    // Add table row for wuId
    tableHTML += "<tr>";
    tableHTML +=
      '<td style="border: 1px solid #D3D3D3; text-align: left; padding-left: 5px;">' +
      wuId +
      "</td>";

    // Add table row for each issue
    tableHTML +=
      '<td style="border: 1px solid #D3D3D3; text-align: left; padding-left: 5px;">';
    issues.forEach((issue) => {
      const [key, value] = Object.entries(issue)[0];
      tableHTML += key + ": " + value + "<br>";
    });
    tableHTML += "</td>";
    tableHTML += "</tr>";
  });

  tableHTML += '</table> <p className="sentNotificationSignature">- Tombolo</p>';

  return tableHTML;
}
// Teams message template ------------------------------------------
const msTeamsCardBody = (tableHtml) => {
  const cardBody = JSON.stringify({
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: "0076D7",
    summary: "Hello world",
    sections: [
      {
        type: "MessageCard",
        contentType: "text/html",
        text: tableHtml,
      },
    ],
    potentialAction: [
      {
        "@type": "ActionCard",
        name: "Add a comment",
        inputs: [
          {
            "@type": "TextInput",
            id: "comment",
            isMultiline: false,
            title: "Add a comment here for this task",
          },
        ],
        actions: [
          {
            "@type": "HttpPOST",
            name: "Add comment",
            target: process.env.API_URL + "/api/updateNotification/update",
            body: `{"comment":"{{comment.value}}"}`,
            isRequired: true,
            errorMessage: "Comment cannot be blank",
          },
        ],
      },
      {
        "@type": "ActionCard",
        name: "Change status",
        inputs: [
          {
            "@type": "MultichoiceInput",
            id: "list",
            title: "Select a status",
            isMultiSelect: "false",
            choices: [
              {
                display: "Triage",
                value: "triage",
              },
              {
                display: "In Progress",
                value: "inProgress",
              },
              {
                display: "Completed",
                value: "completed",
              },
            ],
          },
        ],
        actions: [
          {
            "@type": "HttpPOST",
            name: "Save",
            target: process.env.API_URL + "/api/updateNotification/update",
            body: `{"status":"{{list.value}}"`,
            isRequired: true,
            errorMessage: "Select an option",
          },
        ],
      },
    ],
  });
  return cardBody;
};
// ------------------------------------------------------------------

(async () => {
  try {
    // 1. Get job monitoring_id from worker
    const {
      job: {
        worker: { jobMonitoring_id },
      },
    } = workerData;

    // 2. Get job monitoring details
    const {
      metaData,
      cluster_id,
      application_id,
      name: monitoringName,
    } = await JobMonitoring.findOne({
      where: { id: jobMonitoring_id },
    });

    // Destructure job monitoring metaData
    const {
      notificationConditions,
      notifications,
      jobName,
      costLimits,
      last_monitored,
      unfinishedWorkUnits,
      thresholdTime,
    } = metaData;

    //3. Get cluster offset & time stamp etc
    const { timezone_offset, name: cluster_name } = await cluster.findOne({
      where: { id: cluster_id },
      raw: true,
    });
    const now = new Date();
    const utcTime = now.getTime();
    const remoteUtcTime = new Date(utcTime + timezone_offset * 60000);
    const timeStamp = remoteUtcTime.toISOString();

    // Check if a notification condition is met
    const checkIfNotificationConditionMet = (notificationConditions, wu) => {
      const metConditions = {
        name: wu.Jobname,
        wuId: wu.Wuid,
        State: wu.State,
        clusterName: cluster_name,
        issues: [],
      };

      if (
        notificationConditions.includes("aborted") &&
        wu.State === "aborted"
      ) {
        metConditions.issues.push({ Alert: "Work unit Aborted" });
      }

      if (notificationConditions.includes("failed") && wu.State === "failed") {
        metConditions.issues.push({ Alert: "Work unit Failed" });
      }

      if (
        notificationConditions.includes("unknown") &&
        wu.State === "unknown"
      ) {
        metConditions.issues.push({ Alert: "Work state Unknown" });
      }

      if (
        notificationConditions.includes("thresholdTimeExceeded") &&
        thresholdTime < wu.TotalClusterTime
      ) {
      }

      if (
        notificationConditions.includes("maxExecutionCost") &&
        wu.ExecuteCost > costLimits.maxExecutionCost
      ) {
      }

      if (
        notificationConditions.includes("maxFileAccessCost") &&
        wu.FileAccessCost > costLimits.maxFileAccessCost
      ) {
      }

      if (
        notificationConditions.includes("maxCompileCost") &&
        wu.CompileCost > costLimits.maxCompileCost
      ) {
      }

      if (
        notificationConditions.includes("maxTotalCost") &&
        wu.FileAccessCost + wu.CompileCost + wu.FileAccessCost >
          costLimits.maxCompileCost
      ) {
      }

      if (metConditions.issues.length > 0) {
        return metConditions;
      } else {
        return null;
      }
    };

    //4. Get all workUnits with a given name that were executed since  last time this monitoring ran
    const wuService = await hpccUtil.getWorkunitsService(cluster_id);
    const {
      Workunits: { ECLWorkunit },
    } = await wuService.WUQuery({
      Jobname: jobName,
      StartDate: last_monitored,
    });

    // 5. Iterate through all the work units, If they are in wait, blocked or running status separate them.
    let newUnfinishedWorkUnits = [...unfinishedWorkUnits];
    const notificationsToSend = [];
    ECLWorkunit.forEach((wu) => {
      if (
        wu.State === "wait" ||
        wu.State === "running" ||
        wu.State === "blocked"
      ) {
        newUnfinishedWorkUnits.push(wu.Wuid );
      }
          const conditionMetWus = checkIfNotificationConditionMet(
            notificationConditions,
            wu
          );

          if (conditionMetWus) {
            notificationsToSend.push(conditionMetWus);
          }
      
    });

    // Iterate over jobs that are/were unfinished - check if status has changed
    const wuToStopMonitoring = [];
    for (let wuid of unfinishedWorkUnits) {
      const {
        Workunits: { ECLWorkunit },
      } = await wuService.WUQuery({
        Wuid: wuid,
      });
      const conditionMet = checkIfNotificationConditionMet(
        notificationConditions,
        ECLWorkunit[0]
      );

      if (conditionMet) {
        notificationsToSend.push(conditionMet);
      }

      // Stop monitoring if wu reached end of life cycle
      if (
        ECLWorkunit[0].State != "wait" &&
        ECLWorkunit[0].State != "running" &&
        ECLWorkunit[0].State != "blocked"
      ) {
        wuToStopMonitoring.push(wuid);
      }
    }

   newUnfinishedWorkUnits = newUnfinishedWorkUnits.filter((wu) =>
     !wuToStopMonitoring.includes(wu)
   );

    // If conditions met send out notifications
    const notificationDetails = {}; // channel and recipients {eMail: ['abc@d.com']}
    notifications.forEach((notification) => {
      notificationDetails[notification.channel] = notification.recipients;
    });

    const sentNotifications = [];

    // E-mail
    if (notificationDetails.eMail && notificationsToSend.length > 0) {
      try {
        const notification_id = uuidv4();
        const emailBody = jobMonitoringEmailBody(
          notificationsToSend,
          timeStamp
        );
        const response = await notify({
          to: notificationDetails.eMail,
          from: process.env.EMAIL_SENDER,
          subject: `Alert from ${monitoringName}`,
          text: emailBody,
          html: emailBody,
        });

        // If notification sent successfully
        if (response.accepted && response.accepted.length > 0) {
          sentNotifications.push({
            id: notification_id,
            application_id: application_id,
            monitoring_type: "Job Monitoring",
            monitoring_id: jobMonitoring_id,
            notification_reason: "Met notification conditions",
            status: "notified",
            notification_channel: "eMail",
            metaData: { notificationBody: emailBody },
          });
        }
      } catch (err) {
        logger.error(err);
      }
    }

    if (notificationDetails.msTeams && notificationsToSend.length > 0) {
      const recipients = notificationDetails.msTeams;
      const cardBody = jobMonitoringEmailBody(notificationsToSend, timeStamp);

      for (let recipient of recipients) {
        try {
          const notification_id = uuidv4();

          const response = await axios.post(
            recipient,
            msTeamsCardBody(cardBody)
          );

          if (response.status === 200) {
            sentNotifications.push({
              id: notification_id,
              application_id: application_id,
              monitoring_type: "jobMonitoring",
              monitoring_id: jobMonitoring_id,
              notification_reason: "Met notification conditions",
              status: "notified",
              notification_channel: "msTeams",
              metaData: { notificationBody: cardBody },
            });
          }
        } catch (err) {
          logger.error(err);
        }
      }
    }

    // Update job monitoring metadata
    await JobMonitoring.update(
      {
        metaData: {
          ...metaData,
          // last_monitored: "2023-06-28T09:06:01.857Z",
          last_monitored: timeStamp,
          unfinishedWorkUnits: newUnfinishedWorkUnits,
        },
      },
      { where: { id: jobMonitoring_id } }
    );

    // Insert notification into notification table
    if (sentNotifications.length > 0) {
      for (let notification of sentNotifications) {
        try {
          await Monitoring_notifications.create(notification);
        } catch (err) {
          logger.error(err);
        }
      }
    }

    // ----------------------------------------------------------------
  } catch (err) {
    logger.error(err);
  } finally {
    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
  }
})();


