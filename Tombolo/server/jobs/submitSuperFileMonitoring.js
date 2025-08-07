const axios = require('axios');
const { notify } = require('../routes/notifications/email-notification');
const { parentPort, workerData } = require('worker_threads');
const logger = require('../config/logger');
const { SuperfileMonitoring, MonitoringNotification } = require('../models');
const hpccUtil = require('../utils/hpcc-util');
const { v4: uuidv4 } = require('uuid');
const {
  emailBody,
  messageCardBody,
} = require('./messageCards/notificationTemplate');

(async () => {
  try {
    const superfileMonitoringDetails = await SuperfileMonitoring.findOne({
      where: { id: workerData.filemonitoring_id },
      raw: true,
    });

    const {
      id,
      clusterid,
      application_id,
      metaData,
      cron,
      monitoringActive,
      wuid,
      name,
      metaData: {
        fileInfo: {
          Name,
          size,
          Cluster,
          subfileCount,
          mostRecentSubFile,
          mostRecentSubFileDate,
          modified,
        },
        lastMonitored,
        notifications,
        monitoringCondition,
        monitoringCondition: { notifyCondition },
      },
    } = superfileMonitoringDetails;

    //get file details, doesn't include most recently updated subfile for performance/load reasons. Will load later if condition exists
    let superFileDetails = await hpccUtil.getSuperFile(clusterid, Name);

    //hold variable to hold all notifications
    const notificationDetails = { details: { 'Superfile Name': Name } };

    //check if superfile is deleted first,
    if (superFileDetails.Exception) {
      logger.verbose(superFileDetails.Exception[0].Message);
      const superFileDeleted =
        superFileDetails.Exception[0].Message.includes('Cannot find file');

      // If superfile was deleted
      if (superFileDeleted && notifyCondition.includes('deleted')) {
        notificationDetails.value = 'file_deleted';
        notificationDetails.title = 'File below has been deleted - ';
        notificationDetails.text = 'File below has been deleted - ';
        superFileDetails = null;
      } else {
        // if notification for deleted file not set up
        throw new Error(superFileDetails.Exception[0].Message);
      }
    }

    // Keep track of changes
    const metaDifference = [];
    // ['fileSizeChanged', 'deleted', 'subFileCountChange', 'recentSubFileChange'];
    if (superFileDetails && !superFileDetails.Exception) {
      //file size notification
      if (
        notifyCondition.includes('fileSizeChanged') ||
        notifyCondition.includes('fileSizeRange')
      ) {
        const newFileSize = superFileDetails.size;
        if (newFileSize !== size) {
          metaDifference.push({
            attribute: 'File size',
            oldValue: `${size / 1000} KB`,
            newValue: `${newFileSize / 1000} KB`,
          });

          if (
            newFileSize > monitoringCondition.maximumFileSize ||
            newFileSize < monitoringCondition.minimumFileSize
          ) {
            metaDifference.push({
              attribute:
                'File size not in range: ' +
                minimumFileSize / 1000 +
                ' KB - ' +
                maximumFileSize / 1000,
              oldValue: `${size / 1000} KB`,
              newValue: `${newFileSize / 1000} KB`,
            });
          }
          //update metaData fields with new info for updating later
          metaData.fileInfo.size = newFileSize;
        }
      }

      //recent subfile notification && recent count notification, both get returned by same call so only call once
      if (
        notifyCondition.includes('recentSubFileChange') ||
        notifyCondition.includes('subFileCountChange') ||
        notifyCondition.includes('subFileCountRange')
      ) {
        let newRecentFile = await hpccUtil.getRecentSubFile(clusterid, Name);
        if (newRecentFile) {
          if (newRecentFile.recentSubFile !== mostRecentSubFile) {
            metaDifference.push({
              attribute: 'Most Recently Updated Superfile',
              oldValue: `${mostRecentSubFile}`,
              newValue: `${newRecentFile.recentSubFile}`,
            });

            //update metaData fields with new info for updating later
            metaData.fileInfo.mostRecentSubFile = newRecentFile.recentSubFile;
            metaData.fileInfo.mostRecentSubFileDate = newRecentFile.recentDate;
          }

          const newSubFileCount = newRecentFile.subfileCount;

          if (newSubFileCount !== subfileCount) {
            metaDifference.push({
              attribute: 'Subfile Count',
              oldValue: `${subfileCount}`,
              newValue: `${newSubFileCount}`,
            });
          }
          //update metaData fields with new info for updating later
          metaData.fileInfo.subfileCount = newSubFileCount;

          if (
            newSubFileCount > monitoringCondition.maximumSubFileCount ||
            newSubFileCount < monitoringCondition.minimumSubFileCount
          ) {
            let attributeString =
              'Subfile Count out of Range,  ' +
              monitoringCondition.minimumSubFileCount;
            +' - ' + monitoringCondition.maximumSubFileCount;
            metaDifference.push({
              attribute: attributeString,
              oldValue: `${subfileCount}`,
              newValue: `${newSubFileCount}`,
            });
          }
        } else {
          // if notification for deleted file not set up
          throw new Error(
            'No subfiles returned to check for most recently updated.'
          );
        }
      }

      if (notifyCondition.includes('updateInterval')) {
        //update interval is in days, so multiply by 86400000 to get number of milliseconds between updates
        let updateInterval = monitoringCondition.updateInterval;
        let updateIntervalDays = monitoringCondition.updateIntervalDays;

        let superFile = await hpccUtil.getSuperFile(clusterid, Name);

        let newModified = superFile.modified;

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

        //if difference in days !== update interval, and the file has been updated, notify
        if (diffDays !== updateInterval && diffDays !== 0) {
          metaDifference.push({
            attribute: 'File did not follow update schedule',
            oldValue: `${updateInterval} - days defined between updates`,
            newValue: `${diffDays} - days between last updates`,
          });
        }

        //if current amount of days is > defined
        if (diffDaysCurrent > updateInterval) {
          metaDifference.push({
            attribute: 'File is overdue for update',
            oldValue: `${updateInterval} - days defined between updates`,
            newValue: `${diffDaysCurrent} - days since last update`,
          });
        }
        //if updateIntervalDays is set, check that most recent modified day of the week matches setting
        if (updateIntervalDays?.length) {
          const daysOfWeek = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
          ];
          const newDate = new Date(newModified);
          const newDayUpdated = daysOfWeek[newDate.getDay()];

          if (!updateIntervalDays.includes(newDayUpdated)) {
            metaDifference.push({
              attribute: 'File was updated on a day of the week not defined',
              oldValue: `${updateIntervalDays} - days defined`,
              newValue: `${newDayUpdated} - day updated`,
            });
          }
        }
      }

      // update superfile monitoring last monitored date
      const date = new Date();
      const currentTimeStamp = date.getTime();
      metaData.lastMonitored = currentTimeStamp;

      await SuperfileMonitoring.update(
        { metaData },
        { where: { id: workerData.filemonitoring_id } }
      );
    }

    // Check what notification channel is set up
    let emailNotificationDetails;
    let teamsNotificationDetails;

    // notifications.channel === "eMail"

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
      notificationDetails.value = 'Superfile details have changed';
      notificationDetails.title = 'Some superfile details have been changed ';
      notificationDetails.text = 'Some superfile details have been changed ';
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
            file_name: Name,
            monitoring_type: 'superFile',
            status: 'notified',
            notifiedTo: emailNotificationDetails.recipients,
            notification_channel: 'eMail',
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
            file_name: Name,
            monitoring_type: 'superFile',
            status: 'notified',
            notifiedTo: teamsNotificationDetails.recipients,
            notification_channel: 'msTeams',
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
        await MonitoringNotification.bulkCreate(sentNotifications);
      } catch (err) {
        logger.error(err);
      }
    }
  } catch (err) {
    logger.error(err);
  } finally {
    parentPort ? parentPort.postMessage('done') : process.exit(0);
  }
})();
