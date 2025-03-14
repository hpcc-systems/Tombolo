const logger = require("../../config/logger");

const WUAlertDataPoints = () => {
  return [
    "Wuid",
    "WarningCount",
    "ErrorCount",
    "GraphCount",
    "SourceFileCount",
    "ResultCount",
    "TotalClusterTime",
    "FileAccessCost",
    "CompileCost",
    "ExecuteCost",
  ];
};

const convertTotalClusterTimeToSeconds = (totalClusterTime) => {
  //take off the milliseconds
  const cleanedTime = totalClusterTime.split(".")[0];
  //split on colon
  const timeParts = cleanedTime.split(":");

  const multipliers = [1, 60, 3600, 86400]; //seconds, minutes, hours, days

  //reverse order of timeParts so seconds are first
  timeParts.reverse();

  let total = 0;

  timeParts.forEach((part, index) => {
    total += parseInt(part) * multipliers[index];
  });

  return total;
};

const timeSeriesAnalysis = ({ currentRun, lastRuns }) => {
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

  return [{ alertPoints, data }];
};

module.exports = {
  timeSeriesAnalysis,
  WUAlertDataPoints,
  convertTotalClusterTimeToSeconds,
};
