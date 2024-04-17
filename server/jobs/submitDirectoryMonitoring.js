const logger = require("../config/logger");
const models = require("../models");
const directoryMonitoring = models.directoryMonitoring;
const teamsWebhooks = models.teams_hook;
const notification = models.notification_queue;
const hpccUtil = require("../utils/hpcc-util");
const { v4: uuidv4 } = require("uuid");
const wildCardStringMatch = require("../utils/wildCardStringMatch");
const { parentPort, workerData } = require("worker_threads");
const moment = require("moment");

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
    let files = result.filter((item) => !item.isDir);

    const newFilesToMonitor = [];
    const fileAndTimeStamps = [];

    // Notification Details
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

    let newNotificationDetails = [];

    //check if number of files in the directory is within the range
    if (files.length < minimumFilecount) {
      newNotificationDetails.push({
        value: "file_count_below_minimum",
        title: `File count below minimum in ${directory.join("/")}`,
        text: `Number of files in ${directory.join(
          "/"
        )} is below the minimum file count of ${minimumFilecount}`,
        details: {
          "Landing zone": landingZone,
          Directory: directory.join("/"),
          "File count": files.length,
        },
      });
    }

    if (files.length > maximumFileCount) {
      newNotificationDetails.push({
        value: "file_count_above_maximum",
        title: `File count above maximum in ${directory.join("/")}`,
        text: `Number of files in ${directory.join(
          "/"
        )} is above the maximum file count of ${maximumFileCount}`,
        details: {
          "Landing zone": landingZone,
          Directory: directory.join("/"),
          "File count": files.length,
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
          (item) =>
            item.name === fileName && item.modifiedTime === fileModifiedTime
        )
      ) {
        //Check if user wants to be notified when new file arrives
        let notificationDetail;
        if (fileDetected) {
          notificationDetail = {
            value: "file_detected",
            title: `New file uploaded to ${directory.join("/")}`,
            text: "Details about recently added file - ",
            details: {
              "File Name": fileName,
              "Landing zone": landingZone,
              Directory: directory.join("/"),
              "File detected at": new Date(fileModifiedTime).toString(),
            },
          };
        }

        if (notificationDetail) {
          newNotificationDetails.push(notificationDetail);
        }

        // Start monitoring new file if threshold parameter is set
        if (notifyCondition.includes("fileNotMoving")) {
          newFilesToMonitor.push({
            name: fileName,
            modifiedTime: fileModifiedTime,
            threshold: currentTimeStamp + threshold * 60 * 1000,
            notified: [],
          });
        }
      }
    }

    //If files that were previously being monitored does not exist, stop monitoring
    currentlyMonitoring = currentlyMonitoring.reduce(
      (acc, current, index, array) => {
        const obj = fileAndTimeStamps.find((item) => {
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

    // check for threshold
    for (let current of currentlyMonitoring) {
      const { notified } = current;
      const pastExpectedMoveTime = current.threshold < currentTimeStamp;
      //if it isn't past the threshold time,
      if (pastExpectedMoveTime && !notified) {
        newNotificationDetails.push({
          value: "file_not_moving",
          title: `${current.name} stuck at ${directory.join(" / ")}`,
          text: `${current.name} has been stuck at ${directory.join(
            "/"
          )} longer than ${threshold} minutes`,
          details: {
            "File Name": current.name,
            "Landing zone": landingZone,
            Directory: directory.join("/"),
            "File received at": new Date(current.modifiedTime).toString(),
            "Expected move time": new Date(current.threshold).toString(),
          },
        });
      }
    }

    //update directory monitoring
    metaData.lastMonitored = currentTimeStamp;
    metaData.currentlyMonitoring = [
      ...currentlyMonitoring,
      ...newFilesToMonitor,
    ];

    //send notifications if necessary
    if (newNotificationDetails.length > 0) {
      //send email notification
      if (emailNotificationDetails) {
        //TODO: create notification queue with proper template in next isue
        logger.verbose("Email notification sent: " + newNotificationDetails);
      }

      //send teams notification
      if (teamsNotificationDetails) {
        //TODO: create notification queue with proper template in next isue
        logger.verbose("Teams notification sent: " + newNotificationDetails);
      }
    }

    await directoryMonitoring.update(
      { metaData },
      { where: { id: directorymonitoring_id } }
    );
  } catch (error) {
    logger.error("Error while running Directory Monitoring Jobs: " + error);
  }
})();
