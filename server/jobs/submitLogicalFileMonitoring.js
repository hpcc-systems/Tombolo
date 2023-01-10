const axios = require("axios");
const { notify } = require("../routes/notifications/email-notification");
const { parentPort, workerData } = require("worker_threads");
const logger = require("../config/logger");
const models = require("../models");
const fileMonitoring = models.fileMonitoring;
const hpccUtil = require("../utils/hpcc-util");
const { v4: uuidv4 } = require("uuid");
const fileMonitoring_notifications = models.filemonitoring_notifications;
const NotificationTemplate = require("./messageCards/notificationTemplate.js");

(async () => {
  try {
    logger.verbose("Submit logical file monitoring triggered");
    const fileMonitoringDetails = await fileMonitoring.findOne({
      where: { id: workerData.filemonitoring_id },
      raw: true,
    });

    const {
      cluster_id,
      id: filemonitoring_id,
      application_id,
      metaData,
      metaData: {
        notifications,
        fileInfo: {
          Name,
          Modified,
          Filesize,
          Owner,
          ContentType,
          IsCompressed,
          IsRestricted,
        },
        monitoringCondition,
        monitoringCondition: { notifyCondition },
      },
    } = fileMonitoringDetails;

    // Get file details from HPCC to compare  if any things of interest have been changed
    const logicalFileDetail = await hpccUtil.logicalFileDetails(
      Name,
      cluster_id
    );

    //When to notify -> ["fileSizeChanged","incorrectFileSize","owner","fileType","compressed","protected","deleted"];
    // Message card details ->
    let cardTitle = `Monitoring ${Name} ${new Date().toLocaleString("en-US")}`;
    const facts = [];

    if (logicalFileDetail.Exception) {
      logger.verbose(logicalFileDetail.Exception[0].Message);
      const fileDeleted =
        logicalFileDetail.Exception[0].Message.includes("Cannot find file");

      // If file was deleted
      if (fileDeleted && notifyCondition.includes("deleted")) {
          facts.push({
            activity: 'File has been deleted',
            facts: []
          });
      } else {
        // if notification for deleted file not set up
        throw new Error(logicalFileDetail.Exception[0].Message);
      }
    }

    //if modified time stamp is unchanged, no need to proceed - return here
    if (Modified === logicalFileDetail.Modified) {
      logger.verbose(`logical file - ${Name} is not modified - Break here`);
      return;
    } else {
      // This file has been modified. Update file metaData before proceeding
      const newMeta = {
        ...metaData,
          fileInfo: {
            Name: logicalFileDetail.Name,
            Dir: logicalFileDetail.Dir,
            Filesize: logicalFileDetail.FileSizeInt64 / 1000,
            Wuid: logicalFileDetail.Wuid,
            Owner: logicalFileDetail.Owner,
            Modified: logicalFileDetail.Modified,
            isSuperfile: logicalFileDetail.isSuperfile,
            ContentType: logicalFileDetail.ContentType,
            IsCompressed: logicalFileDetail.IsCompressed,
            IsRestricted: logicalFileDetail.IsRestricted,
          },
      };
      await fileMonitoring.update(
        { metaData: newMeta },
        { where: { id: filemonitoring_id } }
      );
      logger.verbose( `${Name} has been modified - updated file  metadata`);
    }

    if (notifyCondition.includes("fileSizeChanged")) {
      // If file size is changed and user has subscribed
      const newFileSize = logicalFileDetail.FileSizeInt64 / 1000;

      if (newFileSize !== Filesize) {
        facts.push({
          activity: "File size has changed",
          facts: [
          {
            name: "Old File Size",
            value: `${Filesize} KB`,
          },
          {
            name: "New File Size",
            value: `${newFileSize} KB`,
          }]
        }
        );
      }
    }

    if (notifyCondition.includes("incorrectFileSize")) {
      const { maximumFileSize, minimumFileSize } = monitoringCondition;
      const { FileSizeInt64 } = logicalFileDetail; // Actual file size
      const newFileSize = parseInt(FileSizeInt64) / 1000

      if (newFileSize > maximumFileSize || newFileSize < minimumFileSize) {
        facts.push({
          activity: "File size not in range",
          facts: [
            {
              name: "Expected max size",
              value: `${maximumFileSize} KB`,
            },
            {
              name: "Expected min size",
              value: `${minimumFileSize} KB`,
            },
            {
              name: "Actual file size",
              value: `${newFileSize} KB`,
            },
          ],
        });
      }
    }

    if (notifyCondition.includes("owner")) {
      if (logicalFileDetail.Owner !== Owner) {
          facts.push({
            activity: "File size not in range",
            facts: [
              {
                name: "Old owner",
                value: Owner,
              },
              {
                name: "New owner",
                value: logicalFileDetail.Owner,
              }],
          });
      }
    }

    if (notifyCondition.includes("fileType")) {
      if (logicalFileDetail.ContentType !== ContentType) {
        facts.push({
          activity: "File type is changed",
          facts: [
            {
              name: "Old file type",
              value: ContentType,
            },
            {
              name: "New file type",
              value: logicalFileDetail.ContentType,
            }],
        });
      }
    }

    if (notifyCondition.includes("compressed")) {
      if (logicalFileDetail.IsCompressed !== IsCompressed) {
        facts.push({
          activity: "isCompressed flag changed",
          facts: [{
            name: "Old is compressed value",
            value: IsCompressed,
          },
          {
            name: "New is compressed value",
            value: logicalFileDetail.IsCompressed,
          }]
        });
      }
    }

    if (notifyCondition.includes("protected")) {
      if (logicalFileDetail.IsRestricted !== IsRestricted) {
        facts.push({
          activity: "isRestricted flag changed",
          facts: [{
              name: "Old is restricted value",
              value: IsRestricted,
            },
            {
              name: "New is restricted value",
              value: logicalFileDetail.IsRestricted,
            }],
        });
      }
    }

    // Check what notification channel is set up
    let emailNotificationDetails;
    let teamsNotificationDetails;

    for (let notification of notifications) {
      if (notification.channel === "eMail") {
        emailNotificationDetails = notification;
      }
      if (notification.channel === "msTeams") {
        teamsNotificationDetails = notification;
      }
    }

    //------------------------------------------------------------------------------
    if (facts.length > 0) {
      if(teamsNotificationDetails){
          allRequests = [];
          const msTeamsUrl = teamsNotificationDetails.recipients;
          const notification_id = uuidv4();

          const card = createMessageCard({
            facts,
            message: `Monitoring ${Name} ${new Date().toLocaleString("en-US")}`,
            notification_id,
            filemonitoring_id,
          });

          const message = JSON.stringify(card);

          // make post request to Team's url
          for (let url of msTeamsUrl) {
            allRequests.push(axios.post(url, message));
          }
          await Promise.all(allRequests);
          logger.verbose("Notification pushed to Teams's channel");

          // Record notification in notification table
          try{
            await fileMonitoring_notifications.create({
                id: notification_id,
                file_name: Name,
                status: "notified",
                notifiedTo: teamsNotificationDetails.recipients,
                notification_channel: "msTeams",
                notification_reason: facts.map(item => item.activity).join(", "),
                application_id,
                filemonitoring_id,
              });
          } catch (err) {
              logger.error(err);
          }
      }
      
      if(emailNotificationDetails){
        const notification_id = uuidv4();
        const notificationTemplate = new NotificationTemplate(facts);
      
        try {
          const notificationResponse = await notify({
            to: emailNotificationDetails.recipients,
            from: process.env.EMAIL_SENDER,
            subject: `Monitoring ${Name} ${new Date().toLocaleString("en-US")}`,
            html: notificationTemplate.factsListHtml(),
          });
          if (notificationResponse.accepted){
            logger.verbose("Successfully sent email notification");
            // Record notification in notification table
            try {
              await fileMonitoring_notifications.create({
                id: notification_id,
                file_name: Name,
                status: "notified",
                notifiedTo: teamsNotificationDetails.recipients,
                notification_channel: "eMail",
                notification_reason: facts.map(item => item.activity).join(", "),
                application_id,
                filemonitoring_id,
              });
            } catch (err) {
              logger.error(err);
            }

          }
        }catch(err){
          console.log('------------------------------------------');
          console.dir(err)
          console.log('------------------------------------------');
              }
    }
  }
  } catch (err) {
    logger.error(err);
  } finally {
    parentPort ? parentPort.postMessage("done") : process.exit(0);
  }
})();