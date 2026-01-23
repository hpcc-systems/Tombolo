import axios from 'axios';
import { parentPort, workerData } from 'worker_threads';
import { notify } from '../routes/notifications/email-notification.js';
import logger from '../config/logger.js';
import { FileMonitoring, MonitoringNotification } from '../models.js';
import hpccUtil from '../utils/hpcc-util.js';
import { v4 as uuidv4 } from 'uuid';
import {
  emailBody,
  messageCardBody,
} from './messageCards/notificationTemplate.js';

(async () => {
  try {
    const fileMonitoringDetails = await FileMonitoring.findOne({
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
    let logicalFileDetail = await hpccUtil.logicalFileDetails(Name, cluster_id);

    const notificationDetails = { details: { 'File Name': Name } };

    if (logicalFileDetail.Exception) {
      logger.verbose(logicalFileDetail.Exception[0].Message);
      const fileDeleted =
        logicalFileDetail.Exception[0].Message.includes('Cannot find file');

      // If file was deleted
      if (fileDeleted && notifyCondition.includes('deleted')) {
        notificationDetails.value = 'file_deleted';
        notificationDetails.title = 'File below has been deleted - ';
        notificationDetails.text = 'File below has been deleted - ';
        logicalFileDetail = null;
      } else {
        // if notification for deleted file not set up
        throw new Error(logicalFileDetail.Exception[0].Message);
      }
    }

    // Keep track of changes
    const metaDifference = [];

    // ["fileSizeChanged","incorrectFileSize","owner","fileType","compressed","protected","deleted"];
    if (logicalFileDetail) {
      if (Modified === logicalFileDetail.Modified) {
        logger.verbose(`logical file - ${Name} is not modified - Break here`);
        return;
      } else {
        // File  modified,  Update file metaData before proceeding
        try {
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
          await FileMonitoring.update(
            { metaData: newMeta },
            { where: { id: filemonitoring_id } }
          );
          logger.verbose(`Metadata updated for ${Name} `);
        } catch (err) {
          logger.error('submitSprayJob - updateMetaData: ', err);
        }
      }

      if (notifyCondition.includes('fileSizeChanged')) {
        // If file size is changed and user has subscribed
        const newFileSize = logicalFileDetail.FileSizeInt64 / 1000;

        if (newFileSize !== Filesize) {
          metaDifference.push({
            attribute: 'File size',
            oldValue: `${Filesize} KB`,
            newValue: `${newFileSize} KB`,
          });
        }
      }

      if (notifyCondition.includes('incorrectFileSize')) {
        const { maximumFileSize, minimumFileSize } = monitoringCondition;
        const { FileSizeInt64 } = logicalFileDetail; // Actual file size
        const newFileSize = parseInt(FileSizeInt64) / 1000;

        // const notificationDetails = { details: { "File Name": Name } };

        if (newFileSize > maximumFileSize || newFileSize < minimumFileSize) {
          let allDetails = { ...notificationDetails.details };
          allDetails.Warning = 'File size not in range';
          allDetails['Expected Max Size'] = `${maximumFileSize} KB`;
          allDetails['Expected Min Size'] = `${minimumFileSize} KB`;
          allDetails['Actual Size'] = `${newFileSize} KB`;
          notificationDetails.details = allDetails;
        }
      }

      if (notifyCondition.includes('owner')) {
        if (logicalFileDetail.Owner !== Owner) {
          metaDifference.push({
            attribute: 'Owner',
            oldValue: Owner,
            newValue: logicalFileDetail.Owner,
          });
        }
      }

      if (notifyCondition.includes('fileType')) {
        if (logicalFileDetail.ContentType !== ContentType) {
          metaDifference.push({
            attribute: 'File Type',
            oldValue: ContentType,
            newValue: logicalFileDetail.ContentType,
          });
        }
      }

      if (notifyCondition.includes('compressed')) {
        if (logicalFileDetail.IsCompressed !== IsCompressed) {
          metaDifference.push({
            attribute: 'Is Compressed',
            oldValue: IsCompressed,
            newValue: logicalFileDetail.IsCompressed,
          });
        }
      }

      if (notifyCondition.includes('protected')) {
        if (logicalFileDetail.IsRestricted !== IsRestricted) {
          metaDifference.push({
            attribute: 'Is Restricted',
            oldValue: IsRestricted,
            newValue: logicalFileDetail.IsRestricted,
          });
        }
      }
    }

    // Check what notification channel is set up
    let emailNotificationDetails;
    let teamsNotificationDetails;

    for (let notification of notifications) {
      if (notification.channel === 'eMail') {
        emailNotificationDetails = notification;
      }
      if (notification.channel === 'msTeams') {
        teamsNotificationDetails = notification;
      }
    }

    const sentNotifications = [];

    if (metaDifference.length > 0) {
      // Note - this does not cover file size not in range
      notificationDetails.value = 'file_meta_changed';
      notificationDetails.title = 'Some file details have been changed ';
      notificationDetails.text = 'Some file details have been changed ';
    }

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

        logger.verbose(notificationResponse);

        if (notificationResponse.accepted) {
          sentNotifications.push({
            file_name: notificationDetails.details['File Name'],
            status: 'notified',
            notifiedTo: emailNotificationDetails.recipients,
            notification_channel: 'eMail',
            application_id,
            notification_reason: notificationDetails.value,
            filemonitoring_id,
          });
        }
      } catch (err) {
        logger.error('submitSprayJob - emailNotification: ', err);
      }
    }

    // Teams notification
    if (teamsNotificationDetails && notificationDetails.text) {
      const { recipients } = teamsNotificationDetails;
      for (let recipient of recipients) {
        try {
          const notification_id = uuidv4();
          let body = messageCardBody({
            notificationDetails: notificationDetails,
            notification_id,
            filemonitoring_id,
            metaDifference,
          });

          await axios.post(recipient, body);

          sentNotifications.push({
            id: notification_id,
            file_name: notificationDetails.details['File Name'],
            status: 'notified',
            notifiedTo: emailNotificationDetails.recipients,
            notification_channel: 'msTeams',
            application_id,
            notification_reason: notificationDetails.value,
            filemonitoring_id,
          });
        } catch (err) {
          logger.error('submitSprayJob - teamsNotification: ', err);
        }
      }
    }

    // Add sent notifications to notification table
    if (sentNotifications.length > 0) {
      try {
        await MonitoringNotification.bulkCreate(sentNotifications);
      } catch (err) {
        logger.error('submitSprayJob - bulkCreateSentNotifications: ', err);
      }
    }
  } catch (err) {
    logger.error('submitSprayJob: ', err);
  } finally {
    parentPort ? parentPort.postMessage('done') : process.exit(0);
  }
})();
