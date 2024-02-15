// const { parentPort, workerData } = require("worker_threads");
// const { v4: uuidv4 } = require("uuid");
// const axios = require("axios");

// const hpccUtil = require("../utils/hpcc-util");
// const logger = require("../config/logger");
// const models = require("../models");
// const JobMonitoring = models.jobMonitoring;
// const cluster = models.cluster;
// const Monitoring_notifications = models.monitoring_notifications;
// const { notify } = require("../routes/notifications/email-notification");
// const {jobMonitoringEmailBody,msTeamsCardBody} = require("./jobMonitoringNotificationTemplates");

// (async () => {
//   try {
//     // 1. Get job monitoring_id from worker
//     const {
//       job: {
//         worker: { jobMonitoring_id },
//       },
//     } = workerData;

//     // 2. Get job monitoring details
//     const {
//       metaData,
//       cluster_id,
//       application_id,
//       name: monitoringName,
//     } = await JobMonitoring.findOne({
//       where: { id: jobMonitoring_id },
//     });

//     // Destructure job monitoring metaData
//     const {
//       notificationConditions,
//       notifications,
//       jobName,
//       costLimits,
//       last_monitored,
//       unfinishedWorkUnits,
//       thresholdTime,
//     } = metaData;

//     //3. Get cluster offset & time stamp etc
//     const { timezone_offset, name: cluster_name } = await cluster.findOne({
//       where: { id: cluster_id },
//       raw: true,
//     });
//     const now = new Date();
//     const utcTime = now.getTime();
//     const remoteUtcTime = new Date(utcTime + timezone_offset * 60000);
//     const timeStamp = remoteUtcTime.toISOString();

//     //Readable timestamp
//     const ts = new Date(timeStamp);
//     const readableTimestamp = ts.toLocaleString("en-US", {
//       dateStyle: "short",
//       timeStyle: "short",
//     });

//     // Check if a notification condition is met
//     const checkIfNotificationConditionMet = (notificationConditions, wu) => {
//       const metConditions = {
//         name: wu.Jobname,
//         wuId: wu.Wuid,
//         State: wu.State,
//         clusterName: cluster_name,
//         issues: [],
//       };

//       if (
//         notificationConditions.includes("aborted") &&
//         wu.State === "aborted"
//       ) {
//         metConditions.issues.push({ Alert: "Work unit Aborted" });
//       }

//       if (notificationConditions.includes("failed") && wu.State === "failed") {
//         metConditions.issues.push({ Alert: "Work unit Failed" });
//       }

//       if (
//         notificationConditions.includes("unknown") &&
//         wu.State === "unknown"
//       ) {
//         metConditions.issues.push({ Alert: "Work state Unknown" });
//       }

//       if (
//         notificationConditions.includes("thresholdTimeExceeded") &&
//         thresholdTime < wu.TotalClusterTime
//       ) {
//       }

//       if (
//         notificationConditions.includes("maxExecutionCost") &&
//         wu.ExecuteCost > costLimits.maxExecutionCost
//       ) {
//       }

//       if (
//         notificationConditions.includes("maxFileAccessCost") &&
//         wu.FileAccessCost > costLimits.maxFileAccessCost
//       ) {
//       }

//       if (
//         notificationConditions.includes("maxCompileCost") &&
//         wu.CompileCost > costLimits.maxCompileCost
//       ) {
//       }

//       if (
//         notificationConditions.includes("maxTotalCost") &&
//         wu.FileAccessCost + wu.CompileCost + wu.FileAccessCost >
//           costLimits.maxCompileCost
//       ) {
//       }

//       if (metConditions.issues.length > 0) {
//         return metConditions;
//       } else {
//         return null;
//       }
//     };

//     //4. Get all workUnits with a given name that were executed since  last time this monitoring ran
//     const wuService = await hpccUtil.getWorkunitsService(cluster_id);
//     const {
//       Workunits: { ECLWorkunit },
//     } = await wuService.WUQuery({
//       Jobname: jobName,
//       StartDate: last_monitored,
//     });

//     // 5. Iterate through all the work units, If they are in wait, blocked or running status separate them.
//     let newUnfinishedWorkUnits = [...unfinishedWorkUnits];
//     const notificationsToSend = [];
//     ECLWorkunit.forEach((wu) => {
//       if (
//         wu.State === "wait" ||
//         wu.State === "running" ||
//         wu.State === "blocked"
//       ) {
//         newUnfinishedWorkUnits.push(wu.Wuid );
//       }
//           const conditionMetWus = checkIfNotificationConditionMet(
//             notificationConditions,
//             wu
//           );

//           if (conditionMetWus) {
//             notificationsToSend.push(conditionMetWus);
//           }
      
//     });

//     // Iterate over jobs that are/were unfinished - check if status has changed
//     const wuToStopMonitoring = [];
//     for (let wuid of unfinishedWorkUnits) {
//       const {
//         Workunits: { ECLWorkunit },
//       } = await wuService.WUQuery({
//         Wuid: wuid,
//       });
//       const conditionMet = checkIfNotificationConditionMet(
//         notificationConditions,
//         ECLWorkunit[0]
//       );

//       if (conditionMet) {
//         notificationsToSend.push(conditionMet);
//       }

//       // Stop monitoring if wu reached end of life cycle
//       if (
//         ECLWorkunit[0].State != "wait" &&
//         ECLWorkunit[0].State != "running" &&
//         ECLWorkunit[0].State != "blocked"
//       ) {
//         wuToStopMonitoring.push(wuid);
//       }
//     }

//    newUnfinishedWorkUnits = newUnfinishedWorkUnits.filter((wu) =>
//      !wuToStopMonitoring.includes(wu)
//    );

//     // If conditions met send out notifications
//     const notificationDetails = {}; // channel and recipients {eMail: ['abc@d.com']}
//     notifications.forEach((notification) => {
//       notificationDetails[notification.channel] = notification.recipients;
//     });

//     const sentNotifications = [];

//     // E-mail
//     if (notificationDetails.eMail && notificationsToSend.length > 0) {
//       try {
//         const notification_id = uuidv4();
//         const emailBody = jobMonitoringEmailBody({
//           notificationsToSend,
//           jobName,
//           monitoringName,
//           timeStamp: readableTimestamp,
//         });
//         const response = await notify({
//           to: notificationDetails.eMail,
//           from: process.env.EMAIL_SENDER,
//           subject: `Job Monitoring Alert`,
//           text: emailBody,
//           html: emailBody,
//         });

//         // If notification sent successfully
//         if (response.accepted && response.accepted.length > 0) {
//           sentNotifications.push({
//             id: notification_id,
//             application_id: application_id,
//             monitoring_type: "jobMonitoring",
//             monitoring_id: jobMonitoring_id,
//             notification_reason: "Met notification conditions",
//             status: "notified",
//             notification_channel: "eMail",
//             metaData: { notificationBody: emailBody },
//           });
//         }
//       } catch (err) {
//         logger.error(err);
//       }
//     }

//     if (notificationDetails.msTeams && notificationsToSend.length > 0) {
//       const recipients = notificationDetails.msTeams;
//       const cardBody = jobMonitoringEmailBody({
//         notificationsToSend,
//         jobName,
//         monitoringName,
//         timeStamp: readableTimestamp,
//       });

//       for (let recipient of recipients) {
//         try {
//           const notification_id = uuidv4();

//           const response = await axios.post(
//             recipient,
//             msTeamsCardBody(cardBody)
//           );


//           if (response.status === 200) {
//             sentNotifications.push({
//               id: notification_id,
//               application_id: application_id,
//               monitoring_type: "jobMonitoring",
//               monitoring_id: jobMonitoring_id,
//               notification_reason: "Met notification conditions",
//               status: "notified",
//               notification_channel: "msTeams",
//               metaData: { notificationBody: cardBody },
//             });
//           }
//         } catch (err) {
//           logger.error(err);
//         }
//       }
//     }

//     // Update job monitoring metadata
//     await JobMonitoring.update(
//       {
//         metaData: {
//           ...metaData,
//           // last_monitored: "2023-06-28T09:06:01.857Z",
//           last_monitored: timeStamp,
//           unfinishedWorkUnits: newUnfinishedWorkUnits,
//         },
//       },
//       { where: { id: jobMonitoring_id } }
//     );

//     // Insert notification into notification table
//     if (sentNotifications.length > 0) {
//       for (let notification of sentNotifications) {
//         try {
//           await Monitoring_notifications.create(notification);
//         } catch (err) {
//           logger.error(err);
//         }
//       }
//     }
//     // ----------------------------------------------------------------
//   } catch (err) {
//     logger.error(err);
//   } finally {
//     if (parentPort) parentPort.postMessage("done");
//     else process.exit(0);
//   }
// })();



// // 5. way to check if cluster is K8 or not should be changed and teams notification