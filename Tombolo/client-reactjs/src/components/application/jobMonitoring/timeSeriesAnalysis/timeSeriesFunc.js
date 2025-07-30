// Data point to be used for time series analysis
const alertDataPoints = [
  'WarningCount',
  'ErrorCount',
  'GraphCount',
  'SourceFileCount',
  'ResultCount',
  'TotalClusterTime',
  'FileAccessCost',
  'CompileCost',
  'ExecuteCost',
];

// Function to get the decimal places based on the sum
function getDecimalPlaces(sum) {
  // Make sum positive to handle negative cases
  sum = Math.abs(sum);
  if (sum === 0) {
    return 0;
  } else if (sum < 0.01) {
    return 6;
  } else if (sum < 0.1) {
    return 5;
  } else if (sum < 1) {
    return 4;
  } else if (sum < 10) {
    return 3;
  } else if (sum < 100) {
    return 2;
  } else if (sum < 1000) {
    return 1; // Can’t go less than 1 due to rounding/exponent issues
  }
  return 1; // Default case if sum >= 1000 (keeps it safe per your comment)
}

const convertTotalClusterTimeToSeconds = (totalClusterTime) => {
  if (!totalClusterTime) {
    return 0;
  }

  // Ensure it's a string before splitting
  const cleanedTime = String(totalClusterTime).split('.')[0];

  // Split on colon
  const timeParts = cleanedTime.split(':');

  const multipliers = [1, 60, 3600, 86400]; // seconds, minutes, hours, days

  // Reverse order of timeParts so seconds are first
  timeParts.reverse();

  let total = 0;

  timeParts.forEach((part, index) => {
    total += parseInt(part, 10) * multipliers[index];
  });

  return total;
};

export function performTimeSeriesAnalysis({ leftData, rightData }) {
  // Convert left data TotalClusterTime to  numeric value
  for (const [key, value] of Object.entries(leftData)) {
    if (key === 'TotalClusterTime') {
      leftData.TotalClusterTime = convertTotalClusterTimeToSeconds(value);
    }
  }

  // Convert right data TotalClusterTime to  numeric value
  rightData.forEach((run) => {
    for (const [key, value] of Object.entries(run)) {
      if (key === 'TotalClusterTime') {
        run.TotalClusterTime = convertTotalClusterTimeToSeconds(value);
      }
    }
  });

  // Constants for calculation
  const standardDev = 3;

  // Step 1: Calculate averages from rightData
  const average = {};
  alertDataPoints.forEach((point) => {
    const values = rightData.map((item) => item[point] ?? 0); // Treat missing as 0
    const sum = values.reduce((acc, val) => acc + val, 0);
    average[point] = sum / rightData.length;
  });

  // Calculate  differences (Mean - Current value) and square them
  const rightDataCopy = structuredClone(rightData);
  alertDataPoints.forEach((point) => {
    rightDataCopy.forEach((run) => {
      const value = run[point] ?? 0; // Treat missing as 0
      const diff = value - average[point];
      const squared = diff ** 2;
      run[point] = squared;
    });
  });

  // Standard deviation
  const standardDeviationForEachDataPoint = {};
  alertDataPoints.forEach((point) => {
    const values = rightDataCopy.map((item) => item[point] ?? 0); // Treat missing as 0
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / rightData.length;
    // calculate std deviation by getting the sqrt
    standardDeviationForEachDataPoint[point] = Math.sqrt(avg, getDecimalPlaces(avg));
  });

  // Step 2: Calculate expected min/max (min capped at 0)
  const expectedMinMax = {};
  alertDataPoints.forEach((point) => {
    const mean = average[point];
    const min =
      Math.round(
        (mean - standardDev * standardDeviationForEachDataPoint[point]) * Math.pow(10, getDecimalPlaces(mean))
      ) / Math.pow(10, getDecimalPlaces(mean));
    const max =
      Math.round(
        (mean + standardDev * standardDeviationForEachDataPoint[point]) * Math.pow(10, getDecimalPlaces(mean))
      ) / Math.pow(10, getDecimalPlaces(mean));

    expectedMinMax[point] = {
      min,
      max,
    };
  });

  // Step 3: Calculate Z-scores for leftData
  const zIndex = {};
  alertDataPoints.forEach((point) => {
    const mean = Number(average[point]) || 0;
    const value = Number(leftData[point] ?? 0);
    const stdDev = Number(standardDeviationForEachDataPoint[point]) || 0;

    let rawZIndex;
    if (stdDev === 0 || !isFinite(stdDev) || !isFinite(value - mean)) {
      rawZIndex = 0;
    } else {
      rawZIndex = (value - mean) / stdDev;
    }

    const finalZIndex = isFinite(rawZIndex) ? rawZIndex : 0;
    zIndex[point] = Math.round(finalZIndex * 100) / 100;
  });

  // Step 4: Calculate delta (mean - current)
  const delta = {};
  alertDataPoints.forEach((point) => {
    const mean = average[point];
    const value = leftData[point] ?? 0; // Treat missing as 0
    const rawDelta = mean - value;
    delta[point] = rawDelta.toFixed(getDecimalPlaces(rawDelta));
  });

  // Step 5: Identify outliers (true if outside min/max range)
  const outliers = [];
  alertDataPoints.forEach((point) => {
    const value = leftData[point] ?? 0; // Treat missing as 0
    const { min, max } = expectedMinMax[point];
    if (value < min || value > max) {
      outliers.push(point.toLowerCase());
    }
  });

  // Return result in the requested structure
  return {
    average,
    expectedMinMax,
    zIndex,
    delta,
    outliers,
  };
}
