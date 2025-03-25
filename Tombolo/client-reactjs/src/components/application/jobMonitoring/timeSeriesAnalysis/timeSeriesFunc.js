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
  if (sum < 0.01) {
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

function performTimeSeriesAnalysis({ leftData, rightData }) {
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
  const factor = 2; // 2 standard deviations for min/max range

  // Step 1: Calculate averages from rightData
  const average = {};
  alertDataPoints.forEach((point) => {
    const values = rightData.map((item) => item[point] ?? 0); // Treat missing as 0
    const sum = values.reduce((acc, val) => acc + val, 0);
    average[point] = sum / rightData.length;
  });

  // Step 2: Calculate expected min/max (min capped at 0)
  const expectedMinMax = {};
  alertDataPoints.forEach((point) => {
    const mean = average[point];
    const min = mean - standardDev * factor;
    const max = mean + standardDev * factor;
    const rawMin = Math.max(0, min);
    expectedMinMax[point] = {
      min: rawMin.toFixed(getDecimalPlaces(rawMin)),
      max: max.toFixed(getDecimalPlaces(max)),
    };
  });

  // Step 3: Calculate Z-scores for leftData
  const zIndex = {};
  alertDataPoints.forEach((point) => {
    const mean = average[point];
    const value = leftData[point] ?? 0; // Treat missing as 0
    const rawZIndex = (value - mean) / standardDev;
    zIndex[point] = rawZIndex.toFixed(getDecimalPlaces(rawZIndex));
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

module.exports = {
  performTimeSeriesAnalysis,
};
