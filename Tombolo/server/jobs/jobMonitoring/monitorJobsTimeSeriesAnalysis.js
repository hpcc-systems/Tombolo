const logger = require("../../config/logger");
const { parentPort } = require("worker_threads");
const Sequelize = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const models = require("../../models");
const {
  WUAlertDataPoints,
  convertTotalClusterTimeToSeconds,
} = require("./monitorJobsUtil");

const { trimURL } = require("../../utils/authUtil");

// Models
const NotificationQueue = models.notification_queue;
const JobMonitoringData = models.jobMonitoring_Data;

(async () => {
  parentPort &&
    parentPort.postMessage({
      level: "info",
      text: "Job Monitoring:  Time Series Analysis started",
    });
  const now = new Date(); // UTC time
  try {
    //get all job monitoring data that has not been analyzed
    //only select the fields we need to reduce memory usage
    const instances = await JobMonitoringData.findAll({
      where: {
        analyzed: false,
      },
      order: [["date", "DESC"]],
      attributes: [
        "id",
        "applicationId",
        "monitoringId",
        "date",
        "wuTopLevelInfo",
      ],
    });

    // loop through each instance and analyze the data
    for (const instance of instances) {
      const currentRun = instance;
      //get the last 10 runs for the monitoring ID
      const lastRuns = await JobMonitoringData.findAll({
        where: {
          monitoringId: instance.monitoringId,
          id: {
            [Sequelize.Op.ne]: instance.id,
          },
        },
        attributes: ["id", "date", "wuTopLevelInfo"],
        order: [["date", "DESC"]],
        limit: 10,
      });

      //get length of last runs
      const lastRunsLength = lastRuns.length;

      if (!currentRun.monitoringId) {
        //this should never happen, but throw an error if it does
        logger.error(
          "No monitoring ID was provided for Time series analysis - " +
            JSON.stringify(currentRun)
        );
        return;
      }

      //get the alert data points inside an array of named objects
      const alertDataPoints = WUAlertDataPoints();

      let data = [];

      alertDataPoints.forEach((point) => {
        data.push({
          name: point,
        });
      });

      //put current run into data array
      data.forEach((point) => {
        if (point.name === "TotalClusterTime") {
          point.current = convertTotalClusterTimeToSeconds(
            currentRun.wuTopLevelInfo[point.name]
          );
        } else {
          point.current = currentRun.wuTopLevelInfo[point.name];
        }
      });

      //AT THIS POINT ----> [{name: "Cost", current: 2}, {}]

      let i = 1;

      //place all of the data points from the recent runs into data array
      lastRuns.forEach((run) => {
        data.forEach((point) => {
          //if it is TotalClusterTime, run it through convert function
          if (point.name === "TotalClusterTime") {
            point["run" + i] = convertTotalClusterTimeToSeconds(
              run.wuTopLevelInfo[point.name]
            );
          } else {
            point["run" + i] = run.wuTopLevelInfo[point.name];
          }
        });
        i++;
      });

      //AT THIS POINT ----> [{name: "Cost", current: 2, run1: 4, run2: 5}, {}]

      let standardDev = 3;
      //push any values outside of the range to an array of alerts
      let alertPoints = [];
      data.forEach((point) => {
        //don't need to analyze wuid
        if (point.name === "Wuid") {
          return;
        }
        //get total
        let total = 0;
        for (let i = 1; i <= lastRuns.length; i++) {
          // Protection against NaN values
          if(isNaN(point["run" + i])) {
            continue;
          }
          total += point["run" + i];
        }

        //get standard deviation
        let mean = total / lastRuns.length;
        let sum = 0;
        for (let i = 1; i <= lastRuns.length; i++) {
          sum += Math.pow(point["run" + i] - mean, 2);
        }

        point.standardDeviation =
          Math.round(Math.sqrt(sum / lastRuns.length) * 100) / 100;
        point.expectedMin =
          Math.round((mean - standardDev * point.standardDeviation) * 100) /
          100;
        if (point.expectedMin < 0) {
          point.expectedMin = 0;
        }
        point.expectedMax =
          Math.round((mean + standardDev * point.standardDeviation) * 100) /
          100;

        //add z score
        point.zScore = (point.current - mean) / point.standardDeviation;

        point.zScore = Math.round(point.zScore * 100) / 100;

        if (point.standardDeviation === 0) {
          point.zScore = "--";
        }

        point.delta = Math.round((point.current - mean) * 100) / 100;

        //check if current run is outside of the expected range for any of the data points
        if (
          point.current < point.expectedMin ||
          point.current > point.expectedMax
        ) {
          alertPoints.push(point);
        }
      });

      //if any of the data points are outside of the expected range, send an alert
      if (alertPoints.length > 0) {
        //create an alert
        const alert = `Job Monitoring Time Series Analysis:  Job ${currentRun.wuTopLevelInfo["Wuid"]} has a data point that is outside of the expected range`;
        if (parentPort) {
          parentPort.postMessage({
            level: "info",
            text: alert,
          });
        }
        //create a notification
        const notificationId = uuidv4();
        alertPoints.forEach((point) => {
          //if the key is like run1, run2, move it into "historical" object
          let historical = [];
          //limit it to 3 historical runs
          let i = 1;

          if (point.name === "TotalClusterTime") {
            point.name = "Total Cluster Time (seconds)";
          }
          Object.keys(point).forEach((key) => {
            if (i > 3) {
              return;
            }
            if (key.startsWith("run")) {
              historical.push(point[key]);
              delete point[key];
              i++;
            }
          });
          point.historical = historical;
        });

        const humanReadableDate = new Date(currentRun.date).toLocaleString(
          "gmt"
        );

        const link =
          trimURL(process.env.WEB_URL) +
          "/" +
          currentRun.applicationId +
          "/jobMonitoring/timeSeriesAnalysis?id=" +
          currentRun.monitoringId;

        await NotificationQueue.create({
          type: "email",
          templateName: "timeSeriesAnalysisAlert",
          notificationOrigin: "Job Monitoring - Time Series Analysis",
          deliveryType: "immediate",
          metaData: {
            notificationId,
            alertPoints,
            notificationOrigin: "Time Series Analysis",
            notificationDescription: "Time Series Analysis",
            subject:
              "Tombolo - Work Unit Time Series Analysis Alert - " +
              currentRun.wuTopLevelInfo["Wuid"],
            lastRunsLength,
            mainRecipients: ["fancma01@risk.regn.net"],
            Wuid: currentRun.wuTopLevelInfo["Wuid"],
            date: humanReadableDate,
            link,
          },
          createdBy: "system",
        });
      }

      //save the result in metaData
      instance.metaData = data;
      instance.analyzed = true;
      await instance.save();
    }
  } catch (err) {
    parentPort &&
      parentPort.postMessage({
        level: "error",
        text: `Job Monitoring Time Series Analysis:  Error while monitoring jobs: ${err.message}`,
        error: err,
      });
  } finally {
    if (parentPort) {
      parentPort.postMessage({
        level: "info",
        text: `Job Monitoring Time Series Analysis: Monitoring completed in ${
          new Date() - now
        } ms`,
      });
    }
  }
})();
