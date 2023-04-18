const { parentPort, workerData } = require("worker_threads");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const hpccUtil = require("../utils/hpcc-util");
const logger = require("../config/logger");
const models = require("../models");
const JobMonitoring = models.JobMonitoring;
const Monitoring_notifications = models.monitoring_notifications;
const {
  jobMonitoringEmailBody,
  jobMonitoringMessageCardBody,
} = require("./messageCards/notificationTemplate");
const {notify} = require("../routes/notifications/email-notification");
const convertToISODateString = require("../utils/stringToIsoDateString");

(async () => {
  try {
    const {
      job: {
        worker: { jobMonitoring_id },
      },
    } = workerData;

    // Get job monitoring every time this runs to get fresh
    const {
      metaData,
      cluster_id,
      application_id,
      name: monitoringName,
    } = await JobMonitoring.findOne({
      where: { id: jobMonitoring_id },
    });

    const {
      notificationConditions,
      notifications,
      monitoringScope,
      jobName,
      lastMonitoredDetails,
    } = metaData;

    // channel and recipients {eMail: ['abc@d.com']}
    const notificationDetails = {};
    notifications.forEach((notification) => {
      notificationDetails[notification.channel] = notification.recipients;
    });

    // Gather all sent notification data to update notifications table at once
    const sentNotification = [];

    // Work unit service
    const wuService = await hpccUtil.getWorkunitsService(cluster_id);

    // If notification conditions are fulfilled put together notification to send
    const notificationToSend = {}; // notification title, notification body

    // Pulling this out in global context
    let wuDetails; // Individual job monitoring will have only one wu
    const allWuDetails = {}; // cluster job monitoring will have multiple

    // ----------- Monitor individual job -----------------------------------------------------
    // Monitoring scope individualJob
    if (monitoringScope === "individualJob") {
      const {
        Workunits: { ECLWorkunit },
      } = await wuService.WUQuery({ Jobname: jobName });

      wuDetails = ECLWorkunit[0]; // Consider only the latest work unit. There could be multiple WU for same job
      const wuDetailsCleaned = {
        Wuid: wuDetails.Wuid,
        Owner: wuDetails.Owner,
        Cluster: wuDetails.Cluster,
        Jobname: wuDetails.Jobname,
        StateID: wuDetails.StateID,
        State: wuDetails.State,
      };

      if (notificationConditions.includes(wuDetails?.State)) {
        notificationToSend.title = `${jobName} is in ${wuDetails.State} state`;
        notificationToSend.facts = wuDetailsCleaned;
      }
    }

    // ------------- Monitor whole cluster ---------------------------------------------------------

    if (monitoringScope === "cluster") {
      // Create options for each monitoring
      // Since the WQ function does not take array of states as param, we need to make call notificationConditions.length number of times
      const wuQueryOptions = notificationConditions.map((state) => {
        const option = {};
        option.State = state;
        option.Sortby = "StartDate";
        option.Descending = 1;
        option.PageSize = 100000;

        if (lastMonitoredDetails && lastMonitoredDetails.wuId[state]) {
          option.StartDate = convertToISODateString(lastMonitoredDetails.wuId[state]);
        }
        return option;
      });

      for (const option of wuQueryOptions) {
        const {
          Workunits: { ECLWorkunit },
        } = await wuService.WUQuery(option);
        if (ECLWorkunit.length > 0) {
          allWuDetails[option.State] = ECLWorkunit;
        }
      }

      // No new work units update last monitoring ts and return 
      if (Object.keys(allWuDetails).length === 0) {
        await JobMonitoring.update(
          {metaData: { ...metaData, last_monitored: Date.now() }},
          {where: {id: jobMonitoring_id}}
        );
        return;
      }

      if (notificationDetails.eMail) {
        const wuCounts = {};
        for (let key in allWuDetails) {
          wuCounts[key] = allWuDetails[key].length;
        }

        notificationToSend.title ="Job Monitoring Complete";
        notificationToSend.facts = wuCounts;
        notificationToSend.description = `${monitoringName} monitoring complete. Here is the report - `;
        notificationToSend.extraContent = allWuDetails;
      }
    }

    // ---- Common for both cluster and individual job monitoring -----------------------
    //TODO - return here if no notifications subscribed
     const shouldNotify =
       !lastMonitoredDetails ||
       (lastMonitoredDetails &&
         lastMonitoredDetails.wuId === wuDetails?.Wuid &&
         !lastMonitoredDetails?.notified.includes("eMail")) ||
       metaData.monitoringScope === "cluster";

    // E-mail Notification
    if (notificationToSend.title && notificationDetails.eMail) {
      //Make sure user has not already been notified
      if (shouldNotify) {
        const emailBody = jobMonitoringEmailBody(notificationToSend);
        const notificationResponse = await notify({
          to: notificationDetails.eMail,
          from: process.env.EMAIL_SENDER,
          subject: notificationToSend.title,
          text: emailBody,
          html: emailBody,
        });

        // If email notification sent successfully add to sentNotification array to later update notification table
        if (notificationResponse.accepted) {
          sentNotification.push({
            application_id: application_id,
            monitoring_type: "jobMonitoring",
            monitoring_id: jobMonitoring_id,
            notification_reason: wuDetails
              ? `Job state - ${wuDetails.State}`
              : "Job Monitoring",
            notification_channel: "eMail",
            status: "Notified",
          });
        }
      }
    }

    // MsTeams Notification
    if (notificationToSend.title && notificationDetails.msTeams) {
      if (shouldNotify) {
        const recipients = notificationDetails.msTeams;

        for (let recipient of recipients) {
          try {
            const notification_id = uuidv4();

            const cardBody = jobMonitoringMessageCardBody({...notificationToSend, notification_id });
            const response = await axios.post(recipient, cardBody);

            // If notification sent successfully add to sentNotification
            if (response.status === 200) {
              sentNotification.push({
                id: notification_id,
                application_id: application_id,
                monitoring_type: "jobMonitoring",
                monitoring_id: jobMonitoring_id,
                notification_reason: wuDetails?.State
                  ? `Job state - ${wuDetails.State}`
                  : "Job Monitoring",
                status: "Notified",
                notification_channel: "msTeams",
              });
            }
          } catch (err) {
            logger.error(err);
          }
        }
      }
    }

    // Update notification table
    if (sentNotification.length > 0) {
        await Monitoring_notifications.bulkCreate(sentNotification);

    // Update Job Monitoring - notification sent
      let notifiedChannel = sentNotification.map(
        (notification) => notification.notification_channel
      );

      let uniqueNotifiedChannel = notifiedChannel.filter((item, index) => {
        return notifiedChannel.indexOf(item) === index;
      });

      /*  For some reason if notification was NOT sent via one of the channel - we will try to send out notification via that channel on another run.
          we need to keep track for what WU and what State was the previous  notification sent, so we won't end up re-sending the notification */
      // Last notified channel
      if (
        metaData?.lastMonitoredDetails &&
        metaData.monitoringScope === "individualJob"
      ) {
        const {
          lastMonitoredDetails: { wuId, state, notified },
        } = metaData;
        if (wuId === wuDetails.Wuid && state === wuDetails.State) {
          // user was notified about the same WU, same State before via some channel, add new notified channel to existing array
          uniqueNotifiedChannel = [...uniqueNotifiedChannel, ...notified];
        }
      }

      // Last monitored wu for each state
      const workUnits = {}; // {failed : "wuxyz", aborted: "wuabc",unknown: "wu123"}
      if (metaData.monitoringScope === "cluster") {
        for (let key in allWuDetails) {
          workUnits[key] = allWuDetails[key][0].Wuid;
        }
      }

      metaData.lastMonitoredDetails = {
        wuId: wuDetails?.Wuid || {...metaData?.lastMonitoredDetails?.wuId, ...workUnits},
        state: wuDetails?.State,
        notified: uniqueNotifiedChannel,
      };
      metaData.last_monitored = Date.now();

      await JobMonitoring.update(
        { metaData: metaData },
        { where: { id: jobMonitoring_id } }
      );
    } else {
      //If no notification sent- just update the last monitored time stamp
      metaData.last_monitored = Date.now();
      await JobMonitoring.update(
        { metaData: metaData },
        { where: { id: jobMonitoring_id } }
      );
    }
  } catch (err) {
    logger.error(err);
  } finally {
    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
  }
})();
