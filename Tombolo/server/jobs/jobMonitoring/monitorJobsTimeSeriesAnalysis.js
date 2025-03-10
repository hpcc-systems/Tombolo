const timeSeriesAnalysis = ({ currentRun, lastRuns }) => {
  if (!currentRun.monitoringId) {
    //this should never happen, but throw an error if it does
    logger.error(
      "No monitoring ID was provided for Time series analysis - " +
        JSON.stringify(currentRun)
    );
    return;
  }

  //calculate the average of the last 10 records for important stuff - PLACEHOLDER
  let average = [];

  lastRuns.forEach((record) => {
    //add each desired calculation point to the average array - PLACEHOLDER
    //e.g. average.cost += record.metaData.cost;
  });

  //divide each point by the number of records to get the average - PLACEHOLDER
  //average.cost = average.cost / last10.length;

  let alertAttributes = [];
  //compare the current record to the average - PLACEHOLDER
  average.forEach((point) => {
    //if the current record is more than 20% higher than the average, send an alert - PLACEHOLDER
    //e.g. if (data.metaData.cost > point.cost * 1.2) {
    //  alertAttributes.push({'cost'});
    //}
  });

  if (!alertAttributes.length) {
    logger.verbose("No alerts needed for monitoring ID " + data.monitoringId);
    return;
  }

  //Build the data that will build the data table for the last 10 and current
  let dataTable = [];

  alertAttributes.forEach((attribute) => {
    dataTable.push({
      attribute: attribute,
      current: currentRun.metaData[attribute],
      average: average[attribute],
      last5: last5.map((record) => record.metaData[attribute]),
    });
  });

  //send the alert
  //notificationQueue create

  logger.info("finished monitoring");

  return;
};

module.exports = {
  timeSeriesAnalysis,
};
