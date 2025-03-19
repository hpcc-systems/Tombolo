const logger = require("../../config/logger");
const { parentPort } = require("worker_threads");

const models = require("../../models");
const {
  WUAlertDataPoints,
  convertTotalClusterTimeToSeconds,
} = require("./monitorJobsUtil");

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
    if (1 === 2) {
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
          total += point["run" + i];
        }
        //get standard deviation
        let mean = total / lastRuns.length;
        let sum = 0;
        for (let i = 1; i <= lastRuns.length; i++) {
          sum += Math.pow(point["run" + i] - mean, 2);
        }
        point.standardDeviation = Math.sqrt(sum / lastRuns.length);
        point.expectedMin = mean - standardDev * point.standardDeviation;
        point.expectedMax = mean + standardDev * point.standardDeviation;

        //check if current run is outside of the expected range for any of the data points
        if (
          point.current < point.expectedMin ||
          point.current > point.expectedMax
        ) {
          alertPoints.push(point);
        }
      });

      //AT THIS POINT ----> [{name: "Cost", current: 2, run1: 4, run2: 5, standardDeviation: 4, expectedMin: 6, expectedMax: 10}, {Time: 2, run1: 4, run2: 5, standardDeviation: 4, expectedMin: 6, expectedMax: 10}]

      //check if current run is outside of the expected range for any of the data points

      logger.info("finished analyzing");
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

// //grab the last runs for analysis
// let lastRuns = await JobMonitoringData.findAll({
//   where: {
//     monitoringId: instance.monitoringId,
//   },
//   attributes: ["id", "date", "wuTopLevelInfo"],
//   order: [["date", "DESC"]],
//   limit: 10,
// });

// //strip current instance from last runs, don't have access to sequelize.op.ne operator so this is necessary instead of including it in query
// lastRuns = lastRuns.filter((run) => run.id !== instance.id);

// //if there are less than 2 records, we can't do time series analysis
// if (lastRuns.length < 2) {
//   logger.verbose(
//     "Not enough data to perform time series analysis for monitoring ID " +
//       instance.monitoringId
//   );
//   return;
// }

// //pass last records and current run to timeSeriesAnalysisunction
// const result = timeSeriesAnalysis({ currentRun: instance, lastRuns });

// instance.metaData = result;

// logger.info("saving result: " + JSON.stringify(result));
// instance.analyzed = true;

// // save the result in metaData
// await instance.save();

// logger.info("result: " + JSON.stringify(result));

// //if result.length, then we will send an email. That will be a seperate PR.

// return;
