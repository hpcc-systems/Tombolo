const axios = require('axios');
const { parentPort, workerData } = require('worker_threads');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const { notify } = require('../routes/notifications/email-notification');
const logger = require('../config/logger');
const { FileMonitoring, MonitoringNotification } = require('../models');
const hpccUtil = require('../utils/hpcc-util');
const wildCardStringMatch = require('../utils/wildCardStringMatch');

const {
  emailBody,
  messageCardBody,
} = require('./messageCards/notificationTemplate');

(async () => {
  try {
    const fileMonitoringDetails = await FileMonitoring.findOne({
      where: { id: workerData.filemonitoring_id },
      raw: true,
    });

    let {
      name,
      id: filemonitoring_id,
      cluster_id,
      application_id,
      metaData,
      metaData: {
        fileInfo: {
          machine: Netaddr,
          fileName: fileNameWildCard,
          landingZone,
          dirToMonitor,
        },
        lastMonitored,
        currentlyMonitoring,
        monitoringCondition: {
          notifyCondition,
          expectedFileMoveTime,
          maximumFileSize,
          minimumFileSize,
        },
        notifications,
      },
    } = fileMonitoringDetails;

    const cluster = await hpccUtil.getCluster(cluster_id);
    const { timezone_offset } = cluster;

    let currentTimeStamp = moment.utc().valueOf();

    const Path = `/var/lib/HPCCSystems/${landingZone}/${dirToMonitor.join('/')}/`;

    const result = await hpccUtil.getDirectories({
      clusterId: cluster_id,
      Netaddr,
      Path,
      DirectoryOnly: false,
    });
    let files = result.filter(item => !item.isDir);

    const newFilesToMonitor = [];
    const fileAndTimeStamps = [];

    // Notification Details
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

    // Check for file detected, incorrect file size - if found push to this array
    let newFileNotificationDetails = [];

    //Check if new files that matches the fileName(wild card) have arrived since last monitored
    for (let i = 0; i < files.length; i++) {
      let { name: fileName, filesize, modifiedtime } = files[i];

      let fileModifiedTime = moment(modifiedtime); // Convert uploaded_at to a Moment object
      // fileModifiedTime = fileModifiedTime.utc().valueOf() - (60000 * timezone_offset);
      fileModifiedTime = fileModifiedTime.utc().valueOf();

      logger.verbose(
        `Last monitored : ${lastMonitored}, File Uploaded At : ${fileModifiedTime}, ${
          (lastMonitored - fileModifiedTime,
          lastMonitored < fileModifiedTime &&
          wildCardStringMatch(fileNameWildCard, fileName)
            ? 'NEW FILE'
            : 'OLD FILE')
        }`
      );

      if (
        lastMonitored < fileModifiedTime &&
        wildCardStringMatch(fileNameWildCard, fileName)
      ) {
        //Check if user wants to be notified when new file arrives
        let notificationDetail;
        if (notifyCondition.includes('fileDetected')) {
          notificationDetail = {
            value: 'file_detected',
            title: `New file uploaded to ${dirToMonitor.join('/')}`,
            text: 'Details about recently added file - ',
            details: {
              'File Name': fileName,
              'Landing zone': landingZone,
              Directory: dirToMonitor.join('/'),
              'File detected at': new Date(fileModifiedTime).toString(),
            },
          };
        }

        // Check if user wants to be notified for incorrect file size
        if (
          notifyCondition.includes('incorrectFileSize') &&
          maximumFileSize &&
          minimumFileSize
        ) {
          notificationDetail = {
            value: 'incorrect_size',
            title: `New file uploaded to ${dirToMonitor.join()}. File size not in range`,
            text: `New file uploaded to ${dirToMonitor.join()}. File size not in range`,
            details: {
              'File name': fileName,
              'File size': `${filesize / 1000} KB`,
              'Expected maximum size': `${maximumFileSize} KB`,
              'Expected minimum size': `${minimumFileSize} KB`,
              'Landing zone': landingZone,
              Directory: dirToMonitor.join('/'),
              'File detected at': new Date(fileModifiedTime).toString(),
            },
          };
          if (maximumFileSize < filesize / 1000) {
            notificationDetail.text =
              'File is larger than expected maximum size - ';
          } else if (minimumFileSize > filesize / 1000) {
            notificationDetail.text =
              'File is smaller than expected minimum size';
          } else {
            logger.verbose('File within range - do not notify');
          }
        }

        if (notificationDetail) {
          newFileNotificationDetails.push(notificationDetail);
        }

        // Start monitoring new file if [ file is supposed to move out after certain time]
        if (notifyCondition.includes('fileNotMoving')) {
          newFilesToMonitor.push({
            name: fileName,
            modifiedTime: fileModifiedTime,
            expectedFileMoveTime:
              currentTimeStamp + expectedFileMoveTime * 60 * 1000,
            notified: [],
          });
        }
      }
    }

    // Send email notification for new && file not in range
    if (emailNotificationDetails && newFileNotificationDetails.length > 0) {
      for (let detail of newFileNotificationDetails) {
        try {
          const body = emailBody(detail);
          const notificationResponse = await notify({
            to: emailNotificationDetails.recipients,
            from: process.env.EMAIL_SENDER,
            subject: detail.title,
            text: body,
            html: body,
          });
          logger.verbose(notificationResponse);

          if (notificationResponse.accepted) {
            await MonitoringNotification.create({
              // file_name: detail.details["File name"],
              status: 'notified',
              notifiedTo: emailNotificationDetails.recipients,
              notification_channel: 'eMail',
              application_id,
              notification_reason: detail.value,
              monitoring_id: filemonitoring_id,
              monitoring_type: 'file',
            });
          }
        } catch (err) {
          logger.error(err);
        }
      }
    }

    if (teamsNotificationDetails && newFileNotificationDetails.length > 0) {
      for (let detail of newFileNotificationDetails) {
        const { recipients } = teamsNotificationDetails;
        for (let recipient of recipients) {
          try {
            const notification_id = uuidv4();
            let body = messageCardBody({
              notificationDetails: detail,
              notification_id,
            });

            await axios.post(recipient, body);

            await MonitoringNotification.create({
              id: notification_id,
              // file_name: detail.details["File Name"],
              status: 'notified',
              notifiedTo: recipient,
              notification_channel: 'msTeams',
              application_id,
              notification_reason: detail.value,
              monitoring_id: filemonitoring_id,
              monitoring_type: 'file',
            });
          } catch (err) {
            logger.error(err);
          }
        }
      }
    }

    //If files that were previously being monitored does not exist, stop monitoring
    currentlyMonitoring = currentlyMonitoring.reduce(
      (acc, current, index, array) => {
        const obj = fileAndTimeStamps.find(item => {
          return (
            item.name === current.name &&
            item.modifiedTime === current.modifiedTime
          );
        });
        if (obj) {
          return acc.concat([array[index]]);
        } else {
          return acc;
        }
      },
      []
    );

    // Logs monitoring details
    logger.verbose({
      monitoring_name: name,
      watching_directory: Path,
      currentlyMonitoring,
      newFilesToMonitor,
    });

    // Alert if file is stuck
    for (let current of currentlyMonitoring) {
      const { notified } = current;
      const pastExpectedMoveTime =
        current.expectedFileMoveTime < currentTimeStamp;
      if (!pastExpectedMoveTime) continue;

      const currentlyMonitoringNotificationDetails = {
        value: 'file_not_moving',
        title: `${current.name} stuck at ${dirToMonitor.join(' / ')}`,
        text: `${current.name} has been stuck at ${dirToMonitor.join('/')} longer than ${expectedFileMoveTime} minutes`,
        details: {
          'File Name': current.name,
          'Landing zone': landingZone,
          Directory: dirToMonitor.join('/'),
          'File received at': new Date(current.modifiedTime).toString(),
          'Expected move time': new Date(
            current.expectedFileMoveTime
          ).toString(),
        },
      };
      if (emailNotificationDetails && !notified.includes('eMail')) {
        // Send email notification
        try {
          const { value, title } = currentlyMonitoringNotificationDetails;
          const body = emailBody(currentlyMonitoringNotificationDetails);
          const notificationResponse = await notify({
            to: emailNotificationDetails.recipients,
            from: process.env.EMAIL_SENDER,
            subject: title,
            text: body,
            html: body,
          });
          logger.verbose(notificationResponse);

          if (notificationResponse.accepted) {
            current.notified.push('eMail');
            await MonitoringNotification.create({
              file_name: current.name,
              status: 'notified',
              notifiedTo: emailNotificationDetails.recipients,
              notification_channel: 'eMail',
              application_id,
              notification_reason: value,
              monitoring_id: filemonitoring_id,
              monitoring_type: 'file',
            });
          }
        } catch (err) {
          logger.error(err);
        }
      }

      if (teamsNotificationDetails && !notified.includes('msTeams')) {
        // Send teams notification
        const { recipients } = teamsNotificationDetails;
        for (let recipient of recipients) {
          try {
            const { details, value } = currentlyMonitoringNotificationDetails;
            const notification_id = uuidv4();
            let body = messageCardBody({
              notificationDetails: currentlyMonitoringNotificationDetails,
              notification_id,
              filemonitoring_id,
              fileName: current.name,
            });

            await axios.post(recipient, body);
            current.notified.push('msTeams');

            await MonitoringNotification.create({
              id: notification_id,
              file_name: current.name,
              status: 'notified',
              notifiedTo: recipient,
              notification_channel: 'msTeams',
              application_id,
              notification_reason: value,
              monitoring_id: filemonitoring_id,
              monitoring_type: 'file',
            });
          } catch (err) {
            logger.error(err);
          }
        }
      }
    }

    // update file monitoring
    metaData.lastMonitored = currentTimeStamp;
    metaData.currentlyMonitoring = [
      ...currentlyMonitoring,
      ...newFilesToMonitor,
    ];
    await FileMonitoring.update(
      { metaData },
      { where: { id: filemonitoring_id } }
    );
  } catch (err) {
    logger.error(err);
  } finally {
    parentPort ? parentPort.postMessage('done') : process.exit(0);
  }
})();
