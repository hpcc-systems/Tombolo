const logger = require('../config/logger');
const { directoryMonitoring } = require('../models');
const hpccUtil = require('../utils/hpcc-util');
const wildCardStringMatch = require('../utils/wildCardStringMatch');
const { workerData } = require('worker_threads');
const moment = require('moment');

(async () => {
  try {
    //grab all directory monitoring that are active

    const directoryMonitoringDetails = await directoryMonitoring.findOne({
      where: {
        id: workerData.directoryMonitoring_id,
        active: true,
      },
    });

    if (!directoryMonitoringDetails) return;

    let {
      id: directorymonitoring_id,
      cluster_id,
      directory,
      metaData,
      metaData: {
        machine: Netaddr,
        pattern: fileNameWildCard,
        landingZone,
        lastMonitored,
        currentlyMonitoring,
        monitoringCondition: {
          notifyCondition,
          threshold,
          fileDetected,
          maximumFileCount,
          minimumFilecount,
        },
        notifications,
      },
    } = directoryMonitoringDetails;

    let currentTimeStamp = moment.utc().valueOf();

    const Path = `/var/lib/HPCCSystems/${landingZone}/${directory}/`;

    const result = await hpccUtil.getDirectories({
      clusterId: cluster_id,
      Netaddr,
      Path,
      DirectoryOnly: false,
    });
    let files = result.filter(item => !item.isDir);

    const newFilesToMonitor = [];

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

    let newNotificationDetails = [];

    //check if number of files in the directory is within the range
    if (files.length < minimumFilecount) {
      newNotificationDetails.push({
        value: 'file_count_below_minimum',
        title: `File count below minimum in ${directory.join('/')}`,
        text: `Number of files in ${directory.join(
          '/'
        )} is below the minimum file count of ${minimumFilecount}`,
        details: {
          'Landing zone': landingZone,
          Directory: directory.join('/'),
          'File count': files.length,
        },
      });
    }

    if (files.length > maximumFileCount) {
      newNotificationDetails.push({
        value: 'file_count_above_maximum',
        title: `File count above maximum in ${directory.join('/')}`,
        text: `Number of files in ${directory.join(
          '/'
        )} is above the maximum file count of ${maximumFileCount}`,
        details: {
          'Landing zone': landingZone,
          Directory: directory.join('/'),
          'File count': files.length,
        },
      });
    }

    //iterate through files, check for notification parameters and update each file if necessary
    for (let i = 0; i < files.length; i++) {
      let { name: fileName, modifiedtime } = files[i];

      let fileModifiedTime = moment(modifiedtime);

      fileModifiedTime = fileModifiedTime.utc().valueOf();

      //check if file is new
      if (
        lastMonitored < fileModifiedTime &&
        wildCardStringMatch(fileNameWildCard, fileName) &&
        //file name not in the currently monitoring array
        !currentlyMonitoring.find(
          item =>
            item.name === fileName && item.modifiedTime === fileModifiedTime
        )
      ) {
        //Check if user wants to be notified when new file arrives
        let notificationDetail;
        if (fileDetected) {
          notificationDetail = {
            name: fileName,
            value: 'file_detected',
            title: `New file uploaded to ${directory}`,
            text: 'Details about recently added file - ',
            details: {
              'File Name': fileName,
              'Landing zone': landingZone,
              Directory: directory,
              'File detected at': new Date(fileModifiedTime).toString(),
            },
          };
        }

        if (notificationDetail) {
          newNotificationDetails.push(notificationDetail);
        }

        // Start monitoring new file if threshold parameter is set
        if (notifyCondition.includes('fileNotMoving')) {
          newFilesToMonitor.push({
            name: fileName,
            modifiedTime: fileModifiedTime,
            threshold: currentTimeStamp + threshold * 60 * 1000,
            notified: [],
          });
        }
      }
    }

    if (currentlyMonitoring.length > 0) {
      //remove files that have been moved out by checking against files array
      currentlyMonitoring = currentlyMonitoring.filter(current => {
        const { name, modifiedTime } = current;
        return !files.find(
          file => file.name === name && file.modifiedtime === modifiedTime
        );
      });
    }

    // check for threshold
    currentlyMonitoring.forEach(current => {
      const { notified } = current;

      const pastExpectedMoveTime = current.threshold < currentTimeStamp;

      if (pastExpectedMoveTime && !notified.length) {
        newNotificationDetails.push({
          name: current.name,
          value: 'file_not_moving',
          title: `${current.name} stuck at ${directory}`,
          text: `${current.name} has been stuck at ${directory} longer than ${threshold} minutes`,
          details: {
            'File Name': current.name,
            'Landing zone': landingZone,
            Directory: directory,
            'File received at': new Date(current.modifiedTime).toString(),
            'Expected move time': new Date(current.threshold).toString(),
          },
        });
      }
    });

    logger.verbose('newNotificationDetails: ', newNotificationDetails);

    //send notifications if necessary
    for (let notificationDetail of newNotificationDetails) {
      //send email notification
      if (emailNotificationDetails) {
        //TODO: create notification queue with proper template in next isue
        logger.verbose('Email notification sent: ' + newNotificationDetails);

        //once notification is sent, update currently monitoring notified field
        currentlyMonitoring = currentlyMonitoring.map(item => {
          if (notificationDetail.name === item.name) {
            return {
              ...item,
              notified: [
                {
                  notified: true,
                  method: 'email',
                  dateNotified: currentTimeStamp,
                },
              ],
            };
          }
          return item;
        });
      }

      //send teams notification
      if (teamsNotificationDetails) {
        //TODO: create notification queue with proper template in next isue
        logger.verbose('Teams notification sent: ' + newNotificationDetails);

        //once notification is sent, update currently monitoring notified field
        currentlyMonitoring = currentlyMonitoring.map(item => {
          if (notificationDetail.name === item.name) {
            return {
              ...item,
              notified: [
                {
                  notified: true,
                  method: 'msTeams',
                  dateNotified: currentTimeStamp,
                },
              ],
            };
          }
          return item;
        });
      }
    }

    //update directory monitoring
    metaData.lastMonitored = currentTimeStamp;
    metaData.currentlyMonitoring = [
      ...currentlyMonitoring,
      ...newFilesToMonitor,
    ];

    await directoryMonitoring.update(
      { metaData },
      { where: { id: directorymonitoring_id } }
    );
  } catch (error) {
    logger.error('Error while running Directory Monitoring Jobs: ' + error);
  }
})();
