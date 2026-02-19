// Data point to be used for time series analysis
export const alertDataPoints: string[] = [
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
function getDecimalPlaces(sum: number): number {
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
    return 1;
  }
  return 1;
}

const convertTotalClusterTimeToSeconds = (totalClusterTime?: string | number): number => {
  if (!totalClusterTime) {
    return 0;
  }

  const cleanedTime = String(totalClusterTime).split('.')[0];
  const timeParts = cleanedTime.split(':');
  const multipliers = [1, 60, 3600, 86400];
  timeParts.reverse();

  let total = 0;
  timeParts.forEach((part, index) => {
    const n = parseInt(part, 10);
    if (!Number.isNaN(n)) {
      total += n * (multipliers[index] ?? 1);
    }
  });

  return total;
};

export interface WorkUnit {
  Wuid: string;
  Jobname?: string;
  Cluster?: string;
  State?: string;
  sequenceNumber?: number | string;
  Owner?: string;
  [key: string]: any;
}

export interface TimeSeriesResult {
  average: Record<string, number>;
  expectedMinMax: Record<string, { min: number; max: number }>;
  zIndex: Record<string, number>;
  delta: Record<string, string>;
  outliers: string[];
}

export function performTimeSeriesAnalysis({ leftData, rightData }: { leftData: WorkUnit; rightData: WorkUnit[] }): TimeSeriesResult {
  // Convert left data TotalClusterTime to numeric value
  for (const [key, value] of Object.entries(leftData)) {
    if (key === 'TotalClusterTime') {
      leftData.TotalClusterTime = convertTotalClusterTimeToSeconds(value);
    }
  }

  // Convert right data TotalClusterTime to numeric value
  rightData.forEach((run) => {
    for (const [key, value] of Object.entries(run)) {
      if (key === 'TotalClusterTime') {
        run.TotalClusterTime = convertTotalClusterTimeToSeconds(value);
      }
    }
  });

  const standardDev = 3;

  // Step 1: Calculate averages from rightData
  const average: Record<string, number> = {};
  alertDataPoints.forEach((point) => {
    const values = rightData.map((item) => Number(item[point] ?? 0));
    const sum = values.reduce((acc, val) => acc + val, 0);
    average[point] = sum / Math.max(1, rightData.length);
  });

  // Calculate differences (Mean - Current value) and square them
  const rightDataCopy = structuredClone(rightData) as WorkUnit[];
  alertDataPoints.forEach((point) => {
    rightDataCopy.forEach((run) => {
      const value = Number(run[point] ?? 0);
      const diff = value - (average[point] ?? 0);
      const squared = diff ** 2;
      run[point] = squared;
    });
  });

  // Standard deviation
  const standardDeviationForEachDataPoint: Record<string, number> = {};
  alertDataPoints.forEach((point) => {
    const values = rightDataCopy.map((item) => Number(item[point] ?? 0));
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / Math.max(1, rightData.length);
    standardDeviationForEachDataPoint[point] = Math.sqrt(avg);
  });

  // Step 2: Calculate expected min/max (min capped at 0)
  const expectedMinMax: Record<string, { min: number; max: number }> = {};
  alertDataPoints.forEach((point) => {
    const mean = average[point] ?? 0;
    const decimals = getDecimalPlaces(mean);
    const factor = Math.pow(10, decimals);
    const min = Math.round((mean - standardDev * (standardDeviationForEachDataPoint[point] ?? 0)) * factor) / factor;
    const max = Math.round((mean + standardDev * (standardDeviationForEachDataPoint[point] ?? 0)) * factor) / factor;
    expectedMinMax[point] = { min, max };
  });

  // Step 3: Calculate Z-scores for leftData
  const zIndex: Record<string, number> = {};
  alertDataPoints.forEach((point) => {
    const mean = Number(average[point]) || 0;
    const value = Number(leftData[point] ?? 0);
    const stdDev = Number(standardDeviationForEachDataPoint[point]) || 0;

    let rawZIndex: number;
    if (stdDev === 0 || !isFinite(stdDev) || !isFinite(value - mean)) {
      rawZIndex = 0;
    } else {
      rawZIndex = (value - mean) / stdDev;
    }

    const finalZIndex = isFinite(rawZIndex) ? rawZIndex : 0;
    zIndex[point] = Math.round(finalZIndex * 100) / 100;
  });

  // Step 4: Calculate delta (mean - current)
  const delta: Record<string, string> = {};
  alertDataPoints.forEach((point) => {
    const mean = average[point] ?? 0;
    const value = Number(leftData[point] ?? 0);
    const rawDelta = mean - value;
    delta[point] = rawDelta.toFixed(getDecimalPlaces(rawDelta));
  });

  // Step 5: Identify outliers (true if outside min/max range)
  const outliers: string[] = [];
  alertDataPoints.forEach((point) => {
    const value = Number(leftData[point] ?? 0);
    const { min, max } = expectedMinMax[point];
    if (value < min || value > max) {
      outliers.push(point.toLowerCase());
    }
  });

  return {
    average,
    expectedMinMax,
    zIndex,
    delta,
    outliers,
  };
}
