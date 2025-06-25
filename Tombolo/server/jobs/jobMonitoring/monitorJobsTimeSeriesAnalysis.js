const logger = require('../../config/logger');
const { parentPort } = require('worker_threads');
const Sequelize = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  notification_queue: NotificationQueue,
  jobMonitoring_Data: JobMonitoringData,
  jobMonitoring: JobMonitoring,
} = require('../../models');
const {
  WUAlertDataPoints,
  convertTotalClusterTimeToSeconds,
  convertSecondsToHumanReadableTime,
  getOwnerEmailFromUsername,
} = require('./monitorJobsUtil');

const { trimURL } = require('../../utils/authUtil');

// Models

(async () => {
  parentPort &&
    parentPort.postMessage({
      level: 'info',
      text: 'Job Monitoring:  Time Series Analysis started',
    });
  const now = new Date(); // UTC time
  try {
    //get all job monitoring data that has not been analyzed
    //only select the fields we need to reduce memory usage
    const instances = await JobMonitoringData.findAll({
      where: {
        analyzed: true,
      },
      order: [['date', 'DESC']],
      attributes: [
        'id',
        'applicationId',
        'monitoringId',
        'date',
        'wuTopLevelInfo',
      ],
    });

    // loop through each instance and analyze the data
    for (const instance of instances) {
      const wuOwnerUsername = instance.wuTopLevelInfo.Owner;

      const currentRun = instance;
      //get the last 10 runs for the monitoring ID
      const lastRuns = await JobMonitoringData.findAll({
        where: {
          monitoringId: instance.monitoringId,
          id: {
            [Sequelize.Op.ne]: instance.id,
          },
        },
        attributes: ['id', 'date', 'wuTopLevelInfo'],
        order: [['date', 'DESC']],
        limit: 10,
      });

      //get length of last runs
      const lastRunsLength = lastRuns.length;

      if (!currentRun.monitoringId) {
        //this should never happen, but throw an error if it does
        logger.error(
          'No monitoring ID was provided for Time series analysis - ' +
            JSON.stringify(currentRun)
        );
        return;
      }

      //get the alert data points inside an array of named objects
      const alertDataPoints = WUAlertDataPoints();

      let data = [];

      alertDataPoints.forEach(point => {
        data.push({
          name: point,
        });
      });

      //put current run into data array
      data.forEach(point => {
        if (point.name === 'TotalClusterTime') {
          //save it into humanReadableTotalClusterTime
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
      lastRuns.forEach(run => {
        data.forEach(point => {
          //if it is TotalClusterTime, run it through convert function
          if (point.name === 'TotalClusterTime') {
            point['run' + i] = convertTotalClusterTimeToSeconds(
              run.wuTopLevelInfo[point.name]
            );
          } else {
            point['run' + i] = run.wuTopLevelInfo[point.name];
          }
        });
        i++;
      });

      let standardDev = 3;
      //push any values outside of the range to an array of alerts
      let alertPoints = [];
      data.forEach(point => {
        //don't need to analyze wuid
        if (point.name === 'Wuid') {
          return;
        }
        //get total
        let total = 0;
        for (let i = 1; i <= lastRuns.length; i++) {
          // Protection against NaN values
          if (isNaN(point['run' + i])) {
            continue;
          }
          total += point['run' + i];
        }

        //get standard deviation
        let mean = total / lastRuns.length;
        let sum = 0;
        for (let i = 1; i <= lastRuns.length; i++) {
          sum += Math.pow(point['run' + i] - mean, 2);
        }

        //TODO --- Dynamically adjust decimal places based on the data.
        let decimalPlaces = 0;

        //look at the sum and determine a proper number of decimal places necessary to convey information
        if (sum < 0.01) {
          decimalPlaces = 6;
        } else if (sum < 0.1) {
          decimalPlaces = 5;
        } else if (sum < 1) {
          decimalPlaces = 4;
        } else if (sum < 10) {
          decimalPlaces = 3;
        } else if (sum < 100) {
          decimalPlaces = 2;
        } else if (sum < 1000) {
          decimalPlaces = 1; //cant go less than 1 or otherwise math won't work with rounding math due to exponent
        }

        //add metrics to point
        point.standardDeviation =
          Math.round(
            Math.sqrt(sum / lastRuns.length) * Math.pow(10, decimalPlaces)
          ) / Math.pow(10, decimalPlaces);
        point.expectedMin =
          Math.round(
            (mean - standardDev * point.standardDeviation) *
              Math.pow(10, decimalPlaces)
          ) / Math.pow(10, decimalPlaces);
        if (point.expectedMin < 0) {
          point.expectedMin = 0;
        }
        point.expectedMax =
          Math.round(
            (mean + standardDev * point.standardDeviation) *
              Math.pow(10, decimalPlaces)
          ) / Math.pow(10, decimalPlaces);

        point.zScore = (point.current - mean) / point.standardDeviation;

        point.zScore =
          Math.round(point.zScore * Math.pow(10, decimalPlaces)) /
          Math.pow(10, decimalPlaces);

        if (point.standardDeviation === 0) {
          point.zScore = '--';
        }

        point.delta =
          Math.round((point.current - mean) * Math.pow(10, decimalPlaces)) /
          Math.pow(10, decimalPlaces);

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
        // TODO: Add owner email to notification when api exists
        const ownerEmail = getOwnerEmailFromUsername(wuOwnerUsername);
        logger.verbose(`${ownerEmail} would be added to cc`);

        //create an alert
        const alert = `Job Monitoring Time Series Analysis:  Job ${currentRun.wuTopLevelInfo['Wuid']} has a data point that is outside of the expected range`;
        if (parentPort) {
          parentPort.postMessage({
            level: 'info',
            text: alert,
          });
        }
        //create a notification
        const notificationId = uuidv4();
        alertPoints.forEach(point => {
          //if the key is like run1, run2, move it into "historical" object
          let historical = [];

          //limit it to 3 historical runs
          let i = 1;

          Object.keys(point).forEach(key => {
            if (i > 3) {
              return;
            }
            if (key.startsWith('run')) {
              historical.push(point[key]);
              delete point[key];
              i++;
            }
          });

          point.historical = historical;

          //need to convert TotalClusterTime to human readable time
          if (point.name === 'TotalClusterTime') {
            if (point.current > 0) {
              point.current =
                point.current +
                ' (' +
                convertSecondsToHumanReadableTime(point.current) +
                ')';
            }

            point.historical = historical.map(h => {
              let returnString = '';
              if (h > 0) {
                returnString =
                  h + ' (' + convertSecondsToHumanReadableTime(h) + ')';
              } else {
                returnString = h;
              }
              return returnString;
            });
          }
        });

        const humanReadableDate = new Date(currentRun.date).toLocaleString(
          'gmt'
        );

        const link =
          trimURL(process.env.WEB_URL) +
          '/' +
          currentRun.applicationId +
          '/jobMonitoring/timeSeriesAnalysis?id=' +
          currentRun.monitoringId;

        //get recipients from the monitoring
        const monitoring = await JobMonitoring.findByPk(
          currentRun.monitoringId
        );

        const {
          primaryContacts = [],
          secondaryContacts = [],
          notifyContacts = [],
        } = monitoring.metaData?.notificationMetaData;

        await NotificationQueue.create({
          type: 'email',
          templateName: 'timeSeriesAnalysisAlert',
          notificationOrigin: 'Job Monitoring - Time Series Analysis',
          deliveryType: 'immediate',
          metaData: {
            notificationId,
            alertPoints,
            notificationOrigin: 'Time Series Analysis',
            notificationDescription: 'Time Series Analysis',
            subject:
              'Tombolo - Work Unit Time Series Analysis Alert - ' +
              currentRun.wuTopLevelInfo['Wuid'],
            lastRunsLength,
            mainRecipients: primaryContacts,
            cc: [...secondaryContacts, ...notifyContacts], // TODO: Add wuOwnerEmail here when it has data
            Wuid: currentRun.wuTopLevelInfo['Wuid'],
            date: humanReadableDate,
            link,
          },
          createdBy: 'system',
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
        level: 'error',
        text: `Job Monitoring Time Series Analysis:  Error while monitoring jobs: ${err.message}`,
        error: err,
      });
  } finally {
    if (parentPort) {
      parentPort.postMessage({
        level: 'info',
        text: `Job Monitoring Time Series Analysis: Monitoring completed in ${
          new Date() - now
        } ms`,
      });
    }
  }
})();
