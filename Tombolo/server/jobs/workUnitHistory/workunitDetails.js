const { Workunit } = require('@hpcc-js/comms');
const { logOrPostMessage } = require('../jobUtils');
const { getClusterOptions } = require('../../utils/getClusterOptions');
const { getClusters } = require('../../utils/hpcc-util');
const { WorkUnit, WorkUnitDetails } = require('../../models');
const retryWithBackoff = require('../../utils/retryWithBackoff');

// Constants
const TERMINAL_STATES = ['completed', 'failed', 'aborted'];

// Global array to track out-of-range time values
// TODO: Create a notification for this at some point
const outOfRangeTimeValues = [];

/**
 * Logs current memory usage
 */
function logMemoryUsage(context = '') {
  if (global.gc) {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const externalMB = Math.round(memUsage.external / 1024 / 1024);

    logOrPostMessage({
      level: 'info',
      text: `Memory ${context}: Heap ${heapUsedMB}MB/${heapTotalMB}MB, External ${externalMB}MB`,
    });
  }
}

/**
 * Performs garbage collection and logs memory usage
 */
function forceGCAndLog(context = '') {
  if (global.gc) {
    global.gc();
    logMemoryUsage(context);
  }
}

/**
 * Logs summary of out-of-range time values encountered during processing
 */
function logOutOfRangeSummary() {
  if (outOfRangeTimeValues.length === 0) return;

  logOrPostMessage({
    level: 'warn',
    text: `Found ${outOfRangeTimeValues.length} out-of-range time value(s) during processing`,
  });

  // Group by reason
  const byReason = outOfRangeTimeValues.reduce((acc, item) => {
    acc[item.reason] = (acc[item.reason] || 0) + 1;
    return acc;
  }, {});

  logOrPostMessage({
    level: 'info',
    text: `Out-of-range breakdown: ${JSON.stringify(byReason)}`,
  });

  // Show examples
  const examples = outOfRangeTimeValues.slice(0, 3);
  examples.forEach(ex => {
    const days = ex.value ? (ex.value / 86400).toFixed(1) : 'N/A';
    logOrPostMessage({
      level: 'info',
      text: `  Example: ${ex.fieldName} = ${ex.value}s (${days} days) in wuId=${ex.wuId}, reason=${ex.reason}`,
    });
  });
}

/**
 * Logs detailed statistics for a column across a batch
 */
function logBatchStatistics(columnName, batch) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let negativeCount = 0;
  let samples = [];

  for (let i = 0; i < batch.length; i++) {
    const v = batch[i][columnName];
    if (v !== undefined && v !== null) {
      if (v < min) min = v;
      if (v > max) max = v;
      if (v < 0) negativeCount++;
      if (samples.length < 3 && (v < 0 || v > 4294967295)) {
        samples.push({
          rowIndex: i,
          wuId: batch[i].wuId,
          scopeName: batch[i].scopeName,
          [columnName]: v,
        });
      }
    }
  }

  logOrPostMessage({
    level: 'error',
    text: `${columnName} stats across batch: min=${min === Number.POSITIVE_INFINITY ? 'n/a' : min}, max=${max === Number.NEGATIVE_INFINITY ? 'n/a' : max}, negativeCount=${negativeCount}, samples=${JSON.stringify(samples)}`,
  });
}

/**
 * Logs detailed error information for out-of-range database errors
 */
function logOutOfRangeError(error, batch) {
  // Extract the column name from error message
  // e.g., "Out of range value for column 'TimeLocalExecute' at row 24"
  const columnMatch = error.message.match(/column '(\w+)'/);
  const rowMatch = error.message.match(/row (\d+)/);
  const columnName = columnMatch ? columnMatch[1] : 'unknown';
  const rowNum = rowMatch ? parseInt(rowMatch[1], 10) - 1 : -1;

  const errorMsg = `Out of range error for column '${columnName}' at row ${rowNum + 1}/${batch.length}`;
  logOrPostMessage({
    level: 'error',
    text: errorMsg,
  });

  // Log the specific problematic row
  if (rowNum >= 0 && rowNum < batch.length) {
    const problematicRow = batch[rowNum];
    const value = problematicRow[columnName];

    const rowDetails = `Problematic row details:
  wuId: ${problematicRow.wuId}
  scopeId: ${problematicRow.scopeId}
  scopeName: ${problematicRow.scopeName}
  scopeType: ${problematicRow.scopeType}
  ${columnName}: ${value} (type: ${typeof value})`;

    logOrPostMessage({
      level: 'error',
      text: rowDetails,
    });

    // Log ALL values for Time* fields in this row for debugging
    if (columnName.startsWith('Time')) {
      const timeFields = Object.keys(problematicRow).filter(k =>
        k.startsWith('Time')
      );
      const timeValues = {};
      timeFields.forEach(field => {
        const val = problematicRow[field];
        if (val !== null && val !== undefined) {
          timeValues[field] = val;
        }
      });
      const timeValuesStr = JSON.stringify(timeValues, null, 2);
      console.error(`All Time* values in this row:\n${timeValuesStr}`);
      logOrPostMessage({
        level: 'error',
        text: `All Time* values in this row: ${timeValuesStr}`,
      });
    }
  }
  console.error('='.repeat(80) + '\n');

  // Log statistics across entire batch
  logBatchStatistics(columnName, batch);
}

/**
 * Attempts to bulk create records with detailed error diagnostics
 */
async function bulkCreateWithDiagnostics(batch) {
  try {
    await WorkUnitDetails.bulkCreate(batch, {
      updateOnDuplicate: ['updatedAt'],
      logging: false,
    });
  } catch (e) {
    // Enhanced diagnostics for out of range errors
    if (
      e.name === 'SequelizeDatabaseError' &&
      e.message.toLowerCase().includes('out of range')
    ) {
      try {
        logOutOfRangeError(e, batch);
      } catch (diagError) {
        logOrPostMessage({
          level: 'error',
          text: `Diagnostic error: ${diagError.message}`,
        });
      }
    } else {
      // Log error details for non-out-of-range errors
      logOrPostMessage({
        level: 'error',
        text: `bulkCreate error: ${e.name} - ${e.message}`,
      });
    }
    throw e;
  }
}

// Key performance metrics we care about - including all statistical variants
const relevantMetrics = [
  // Time-based metrics
  'TimeElapsed',
  'TimeAvgElapsed',
  'TimeMinElapsed',
  'TimeMaxElapsed',
  'TimeStdDevElapsed',
  'TimeLocalExecute',
  'TimeAvgLocalExecute',
  'TimeMinLocalExecute',
  'TimeMaxLocalExecute',
  'TimeStdDevLocalExecute',
  'TimeTotalExecute',
  'TimeAvgTotalExecute',
  'TimeMinTotalExecute',
  'TimeMaxTotalExecute',
  'TimeStdDevTotalExecute',
  'TimeDiskReadIO',
  'TimeAvgDiskReadIO',
  'TimeMinDiskReadIO',
  'TimeMaxDiskReadIO',
  'TimeStdDevDiskReadIO',
  'TimeDiskWriteIO',
  'TimeAvgDiskWriteIO',
  'TimeMinDiskWriteIO',
  'TimeMaxDiskWriteIO',
  'TimeStdDevDiskWriteIO',
  'TimeBlocked',
  'TimeAvgBlocked',
  'TimeMinBlocked',
  'TimeMaxBlocked',
  'TimeStdDevBlocked',
  'TimeLookAhead',
  'TimeAvgLookAhead',
  'TimeMinLookAhead',
  'TimeMaxLookAhead',
  'TimeStdDevLookAhead',
  'TimeFirstRow',

  // Disk I/O metrics
  'NumDiskRowsRead',
  'NumAvgDiskRowsRead',
  'NumMinDiskRowsRead',
  'NumMaxDiskRowsRead',
  'NumStdDevDiskRowsRead',
  'SizeDiskRead',
  'SizeAvgDiskRead',
  'SizeMinDiskRead',
  'SizeMaxDiskRead',
  'SizeStdDevDiskRead',
  'NumDiskReads',
  'NumAvgDiskReads',
  'NumMinDiskReads',
  'NumMaxDiskReads',
  'SizeDiskWrite',
  'SizeAvgDiskWrite',
  'SizeMinDiskWrite',
  'SizeMaxDiskWrite',
  'SizeStdDevDiskWrite',
  'NumDiskWrites',
  'NumAvgDiskWrites',
  'NumMinDiskWrites',
  'NumMaxDiskWrites',

  // Memory metrics
  'MemoryUsage',
  'MemoryAvgUsage',
  'MemoryMinUsage',
  'MemoryMaxUsage',
  'PeakMemoryUsage',
  'PeakAvgMemoryUsage',
  'PeakMinMemoryUsage',
  'PeakMaxMemoryUsage',
  // SizePeakMemory fields removed - duplicates of PeakMemoryUsage

  // Spill metrics
  'SpillRowsWritten',
  'SpillAvgRowsWritten',
  'SpillMinRowsWritten',
  'SpillMaxRowsWritten',
  'SpillSizeWritten',
  'SpillAvgSizeWritten',
  'SpillMinSizeWritten',
  'SpillMaxSizeWritten',
  'SizeGraphSpill',
  'SizeAvgGraphSpill',
  'SizeMinGraphSpill',
  'SizeMaxGraphSpill',

  // Row processing metrics (removed RowsProcessed duplicates - keeping NumRowsProcessed)
  'NumRowsProcessed',
  'NumAvgRowsProcessed',
  'NumMinRowsProcessed',
  'NumMaxRowsProcessed',

  // Skew metrics (performance distribution across nodes)
  'SkewMinElapsed',
  'SkewMaxElapsed',
  'SkewMinLocalExecute',
  'SkewMaxLocalExecute',
  'SkewMinTotalExecute',
  'SkewMaxTotalExecute',
  'SkewMinDiskRowsRead',
  'SkewMaxDiskRowsRead',
  'SkewMinDiskRead',
  'SkewMaxDiskRead',
  'SkewMinDiskWrite',
  'SkewMaxDiskWrite',
  'SkewMinDiskReadIO',
  'SkewMaxDiskReadIO',
  'SkewMaxDiskWriteIO',

  // Network metrics
  'SizeNetworkWrite',
  'SizeAvgNetworkWrite',
  'SizeMinNetworkWrite',
  'SizeMaxNetworkWrite',
  'NumNetworkWrites',
  'NumAvgNetworkWrites',
  'NumMinNetworkWrites',
  'NumMaxNetworkWrites',

  // Additional performance indicators
  'MaxRowSize',
  'NumIndexRecords',
  'NumStarts',
  'NumStops',
  'OriginalSize',
  'CompressedSize',
  'ScansBlob',
  'ScansIndex',
  'WildSeeks',
  'SeeksBlob',
  'SeeksIndex',

  // Node metrics (which nodes had min/max performance)
  'NodeMinElapsed',
  'NodeMaxElapsed',
  'NodeMinLocalExecute',
  'NodeMaxLocalExecute',
  'NodeMinTotalExecute',
  'NodeMaxTotalExecute',
  'NodeMinDiskRowsRead',
  'NodeMaxDiskRowsRead',
  'NodeMinDiskRead',
  'NodeMaxDiskRead',
  'NodeMinDiskWrite',
  'NodeMaxDiskWrite',
  'NodeMinDiskReadIO',
  'NodeMaxDiskReadIO',
  'NodeMinDiskWriteIO',
  'NodeMaxDiskWriteIO',
  'NodeMinBlocked',
  'NodeMaxBlocked',
  'NodeMinLookAhead',
  'NodeMaxLookAhead',
  'NodeMinFirstRow',
  'NodeMaxFirstRow',
];

const UNIT_LOOKUP = {
  TimeElapsed: 'nanoseconds',
  TimeAvgElapsed: 'nanoseconds',
  TimeMinElapsed: 'nanoseconds',
  TimeMaxElapsed: 'nanoseconds',
  TimeStdDevElapsed: 'nanoseconds',
  TimeLocalExecute: 'nanoseconds',
  TimeAvgLocalExecute: 'nanoseconds',
  TimeMinLocalExecute: 'nanoseconds',
  TimeMaxLocalExecute: 'nanoseconds',
  TimeStdDevLocalExecute: 'nanoseconds',
  TimeTotalExecute: 'nanoseconds',
  TimeAvgTotalExecute: 'nanoseconds',
  TimeMinTotalExecute: 'nanoseconds',
  TimeMaxTotalExecute: 'nanoseconds',
  TimeStdDevTotalExecute: 'nanoseconds',
  TimeDiskReadIO: 'nanoseconds',
  TimeAvgDiskReadIO: 'nanoseconds',
  TimeMinDiskReadIO: 'nanoseconds',
  TimeMaxDiskReadIO: 'nanoseconds',
  TimeStdDevDiskReadIO: 'nanoseconds',
  TimeDiskWriteIO: 'nanoseconds',
  TimeAvgDiskWriteIO: 'nanoseconds',
  TimeMinDiskWriteIO: 'nanoseconds',
  TimeMaxDiskWriteIO: 'nanoseconds',
  TimeStdDevDiskWriteIO: 'nanoseconds',
  TimeBlocked: 'nanoseconds',
  TimeAvgBlocked: 'nanoseconds',
  TimeMinBlocked: 'nanoseconds',
  TimeMaxBlocked: 'nanoseconds',
  TimeStdDevBlocked: 'nanoseconds',
  TimeLookAhead: 'nanoseconds',
  TimeAvgLookAhead: 'nanoseconds',
  TimeMinLookAhead: 'nanoseconds',
  TimeMaxLookAhead: 'nanoseconds',
  TimeStdDevLookAhead: 'nanoseconds',
  TimeFirstRow: 'nanoseconds',

  NumDiskRowsRead: 'int',
  NumAvgDiskRowsRead: 'int',
  NumMinDiskRowsRead: 'int',
  NumMaxDiskRowsRead: 'int',
  NumStdDevDiskRowsRead: 'int',

  SizeDiskRead: 'bytes',
  SizeAvgDiskRead: 'bytes',
  SizeMinDiskRead: 'bytes',
  SizeMaxDiskRead: 'bytes',
  SizeStdDevDiskRead: 'bytes',

  NumDiskReads: 'int',
  NumAvgDiskReads: 'int',
  NumMinDiskReads: 'int',
  NumMaxDiskReads: 'int',

  SizeDiskWrite: 'bytes',
  SizeAvgDiskWrite: 'bytes',
  SizeMinDiskWrite: 'bytes',
  SizeMaxDiskWrite: 'bytes',
  SizeStdDevDiskWrite: 'bytes',

  NumDiskWrites: 'int',
  NumAvgDiskWrites: 'int',
  NumMinDiskWrites: 'int',
  NumMaxDiskWrites: 'int',

  MemoryUsage: 'bytes',
  MemoryAvgUsage: 'bytes',
  MemoryMinUsage: 'bytes',
  MemoryMaxUsage: 'bytes',

  PeakMemoryUsage: 'bytes',
  PeakAvgMemoryUsage: 'bytes',
  PeakMinMemoryUsage: 'bytes',
  PeakMaxMemoryUsage: 'bytes',

  SpillRowsWritten: 'int',
  SpillAvgRowsWritten: 'int',
  SpillMinRowsWritten: 'int',
  SpillMaxRowsWritten: 'int',

  SpillSizeWritten: 'bytes',
  SpillAvgSizeWritten: 'bytes',
  SpillMinSizeWritten: 'bytes',
  SpillMaxSizeWritten: 'bytes',

  SizeGraphSpill: 'bytes',
  SizeAvgGraphSpill: 'bytes',
  SizeMinGraphSpill: 'bytes',
  SizeMaxGraphSpill: 'bytes',

  NumRowsProcessed: 'int',
  NumAvgRowsProcessed: 'int',
  NumMinRowsProcessed: 'int',
  NumMaxRowsProcessed: 'int',

  SkewMinElapsed: 'percentage',
  SkewMaxElapsed: 'percentage',
  SkewMinLocalExecute: 'percentage',
  SkewMaxLocalExecute: 'percentage',
  SkewMinTotalExecute: 'percentage',
  SkewMaxTotalExecute: 'percentage',
  SkewMinDiskRowsRead: 'percentage',
  SkewMaxDiskRowsRead: 'percentage',
  SkewMinDiskRead: 'percentage',
  SkewMaxDiskRead: 'percentage',
  SkewMinDiskWrite: 'percentage',
  SkewMaxDiskWrite: 'percentage',
  SkewMinDiskReadIO: 'percentage',
  SkewMaxDiskReadIO: 'percentage',
  SkewMaxDiskWriteIO: 'percentage',

  SizeNetworkWrite: 'bytes',
  SizeAvgNetworkWrite: 'bytes',
  SizeMinNetworkWrite: 'bytes',
  SizeMaxNetworkWrite: 'bytes',

  NumNetworkWrites: 'int',
  NumAvgNetworkWrites: 'int',
  NumMinNetworkWrites: 'int',
  NumMaxNetworkWrites: 'int',

  MaxRowSize: 'bytes',
  NumIndexRecords: 'int',
  NumStarts: 'int',
  NumStops: 'int',
  OriginalSize: 'bytes',
  CompressedSize: 'bytes',
  ScansBlob: 'int',
  ScansIndex: 'int',
  WildSeeks: 'int',
  SeeksBlob: 'int',
  SeeksIndex: 'int',

  NodeMinElapsed: 'int',
  NodeMaxElapsed: 'int',
  NodeMinLocalExecute: 'int',
  NodeMaxLocalExecute: 'int',
  NodeMinTotalExecute: 'int',
  NodeMaxTotalExecute: 'int',
  NodeMinDiskRowsRead: 'int',
  NodeMaxDiskRowsRead: 'int',
  NodeMinDiskRead: 'int',
  NodeMaxDiskRead: 'int',
  NodeMinDiskWrite: 'int',
  NodeMaxDiskWrite: 'int',
  NodeMinDiskReadIO: 'int',
  NodeMaxDiskReadIO: 'int',
  NodeMinDiskWriteIO: 'int',
  NodeMaxDiskWriteIO: 'int',
  NodeMinBlocked: 'int',
  NodeMaxBlocked: 'int',
  NodeMinLookAhead: 'int',
  NodeMaxLookAhead: 'int',
  NodeMinFirstRow: 'int',
  NodeMaxFirstRow: 'int',
};

const activityIgnoreMetrics = ['FirstRow', 'NodeMin', 'NodeMax'];

const relevantActivityMetrics = relevantMetrics.filter(
  metric =>
    !activityIgnoreMetrics.some(ignoreSubstring =>
      metric.includes(ignoreSubstring)
    )
);

// Create Sets for O(1) lookup instead of O(n) array.includes()
const relevantMetricsSet = new Set(relevantMetrics);
const relevantActivityMetricsSet = new Set(relevantActivityMetrics);

/**
 * Extracts performance metrics from a scope's properties
 * @param {Object} scope - The scope object containing performance data
 * @param {string} clusterId - The cluster ID for error tracking
 * @param {string} wuId - The workunit ID for error tracking
 */
function extractPerformanceMetrics(scope, clusterId, wuId) {
  const metrics = {};

  if (!scope._espState?.Properties?.Property) return metrics;

  const st = scope.scopeType || scope._espState?.ScopeType;
  const currentRelevantMetrics =
    st === 'activity' ? relevantActivityMetricsSet : relevantMetricsSet;

  // DECIMAL(13,6) max value: 9999999.999999 seconds (~115.7 days)
  const MAX_DECIMAL_13_6 = 9999999.999999;

  // Unit lookup and converters

  const convertByUnit = (name, raw) => {
    if (raw === undefined || raw === null) return null;

    // Coerce numeric strings to numbers
    let num = raw;
    if (typeof num === 'string' && num.trim() !== '' && !isNaN(num)) {
      num = Number(num);
    }
    if (typeof num !== 'number' || !isFinite(num)) return null;

    const unit = UNIT_LOOKUP[name];
    switch (unit) {
      case 'nanoseconds': {
        // Convert nanoseconds to seconds with microsecond precision (6 decimal places)
        const seconds = num / 1e9; // nanoseconds to seconds

        // Round to 6 decimal places (microsecond precision)
        const rounded = Math.round(seconds * 1e6) / 1e6;

        // Reject negative values (clock skew/measurement errors)
        if (rounded < 0) {
          outOfRangeTimeValues.push({
            clusterId,
            wuId,
            fieldName: name,
            value: rounded,
            reason: 'negative',
            originalNanoseconds: num,
          });

          logOrPostMessage({
            level: 'warn',
            text: `Out-of-range time value detected: ${name} = ${rounded}s (negative value, likely clock skew) in wuId=${wuId}, clusterId=${clusterId}`,
          });

          return null;
        }

        // Reject values exceeding DECIMAL(13,6) max (timer overflows)
        if (rounded > MAX_DECIMAL_13_6) {
          const days = (rounded / 86400).toFixed(1);

          outOfRangeTimeValues.push({
            clusterId,
            wuId,
            fieldName: name,
            value: rounded,
            reason: 'exceeds_max',
            originalNanoseconds: num,
            maxAllowed: MAX_DECIMAL_13_6,
          });

          logOrPostMessage({
            level: 'warn',
            text: `Out-of-range time value detected: ${name} = ${rounded}s (${days} days, exceeds max ${MAX_DECIMAL_13_6}s) in wuId=${wuId}, clusterId=${clusterId}`,
          });

          return null;
        }

        return rounded;
      }
      case 'percentage': {
        const pct = num / 100; // 10000 -> 100.00
        return Math.round(pct * 100) / 100;
      }
      case 'bytes': {
        return Math.trunc(num);
      }
      case 'int': {
        return Math.trunc(num);
      }
      default:
        return num;
    }
  };

  // Extract properties into clean + converted metrics object
  scope._espState.Properties.Property.forEach(prop => {
    if (currentRelevantMetrics.has(prop.Name)) {
      const value =
        prop.RawValue !== undefined ? prop.RawValue : prop.Formatted;
      const converted = convertByUnit(prop.Name, value);
      if (converted !== null) {
        metrics[prop.Name] = converted;
      }
    }
  });

  return metrics;
}

/**
 * Processes a single scope and converts it to a DB row
 * Returns null if scope should be filtered out
 */
function processScopeToRow(scope, clusterId, wuId) {
  const relevantScopeTypes = ['activity', 'subgraph', 'graph', 'operation'];
  const scopeType = scope._espState?.ScopeType;
  const scopeName = scope._espState?.ScopeName;

  // Filter out irrelevant scopes early
  if (!relevantScopeTypes.includes(scopeType)) return null;
  if (scopeName && scopeName.startsWith('>compile')) return null;

  const metrics = extractPerformanceMetrics(scope, clusterId, wuId);
  if (!metrics || Object.keys(metrics).length === 0) return null;

  // Extract properties efficiently with early termination
  let kind = null;
  let label = null;
  let filename = null;
  const props = scope._espState?.Properties?.Property;

  if (props && Array.isArray(props)) {
    const kindProp = props.find(p => p.Name === 'Kind');
    const labelProp = props.find(p => p.Name === 'Label');
    const filenameProp = props.find(p => p.Name === 'Filename');

    kind = kindProp?.RawValue ?? null;
    label = labelProp?.RawValue ?? null;
    filename = filenameProp?.RawValue ?? null;
  }

  return {
    clusterId,
    wuId,
    scopeId: scope._espState?.Id,
    scopeName: scopeName,
    scopeType: scopeType,
    label: label || null,
    kind: kind || null,
    fileName:
      label && label.includes('Disk Read') && filename ? filename : null,
    ...metrics,
  };
}

/**
 * Fetches workunit details with retry logic
 * @param {object} clusterOptions - HPCC cluster connection options
 * @param {string} wuId - Workunit ID
 * @returns {Promise<Array>} Array of scope performance data
 */
async function fetchWorkunitDetails(clusterOptions, wuId) {
  return await retryWithBackoff(async () => {
    // Attach to workunit and fetch performance data
    const attachedWu = Workunit.attach(clusterOptions, wuId);

    // Highly optimized fetchDetails call - minimal data transfer

    return await attachedWu.fetchDetails({
      ScopeFilter: {
        MaxDepth: 999999,
        // Only get scopes that typically have performance data
        ScopeTypes: ['activity', 'subgraph', 'graph', 'operation'],
      },
      ScopeOptions: {
        IncludeId: true,
        IncludeScope: true,
        IncludeScopeType: true,
      },
      PropertyOptions: {
        IncludeName: true,
        IncludeRawValue: true,
        IncludeFormatted: false, // Don't need formatted strings
        IncludeMeasure: false, // Don't need measure info
        IncludeCreator: false, // Don't need creator info
        IncludeCreatorType: false, // Don't need creator type
      },
      PropertiesToReturn: {
        AllStatistics: true, // Gets TimeElapsed, memory, disk I/O, etc.
        AllProperties: false, // Don't get all properties
        AllAttributes: false, // Skip attributes
        AllHints: false, // Skip hints
        AllNotes: false, // Skip notes
        AllScopes: true,
        // Request only specific properties we need
        Properties: ['Kind', 'Label', 'Filename'].concat(relevantMetrics),
      },
    });
  });
}

/**
 * Main function to fetch and store workunit details
 */
async function workunitDetails() {
  const executionStartTime = new Date();

  logOrPostMessage({
    level: 'info',
    text: 'Starting WorkUnit Details job',
  });

  try {
    // Get all cluster details
    let clusterDetails = [];
    try {
      clusterDetails = await getClusters(null);
    } catch (err) {
      logOrPostMessage({
        level: 'error',
        text: `Error getting clusters: ${err.message}`,
      });
      return;
    }

    if (!clusterDetails || clusterDetails.length === 0) {
      logOrPostMessage({
        level: 'info',
        text: 'No clusters found to process',
      });
      return;
    }

    logOrPostMessage({
      level: 'info',
      text: `Processing ${clusterDetails.length} cluster(s)`,
    });

    // Process each cluster
    for (const clusterDetail of clusterDetails) {
      try {
        if ('error' in clusterDetail) {
          logOrPostMessage({
            level: 'error',
            text: `Failed to get cluster ${clusterDetail.id}: ${clusterDetail.error}, skipping`,
          });
          continue;
        }

        const {
          id: clusterId,
          thor_host: thorHost,
          thor_port: thorPort,
          username,
          hash,
          allowSelfSigned,
        } = clusterDetail;

        logOrPostMessage({
          level: 'info',
          text: `Processing cluster ${clusterId} (${thorHost})`,
        });

        // Get WorkUnits with terminal states and detailsFetched = false, limit to 25
        const workunitsToProcess = await WorkUnit.findAll({
          where: {
            clusterId,
            state: TERMINAL_STATES,
            detailsFetched: false,
          },
          limit: 20,
          order: [['workUnitTimestamp', 'ASC']], // Process most recent first
          raw: true,
        });

        if (!workunitsToProcess || workunitsToProcess.length === 0) {
          logOrPostMessage({
            level: 'info',
            text: `No workunits requiring detail processing found for cluster ${clusterId}`,
          });

          continue;
        }

        logOrPostMessage({
          level: 'info',
          text: `Found ${workunitsToProcess.length} workunits to process for cluster ${clusterId}`,
        });

        // Create cluster options
        const clusterOptions = getClusterOptions(
          {
            baseUrl: `${thorHost}:${thorPort}`,
            userID: username || '',
            password: hash || '',
            timeoutSecs: 180,
          },
          allowSelfSigned
        );

        let processedCount = 0;
        let successCount = 0;
        const successfulWuIds = []; // Track successful workunits for batch update

        // Process each workunit
        for (const workunit of workunitsToProcess) {
          let detailedInfo = null;

          try {
            logOrPostMessage({
              level: 'info',
              text: `[${processedCount + 1}/${workunitsToProcess.length}] Processing workunit ${workunit.wuId} for cluster ${clusterId}`,
            });

            // Fetch detailed performance data (raw scopes)
            detailedInfo = await fetchWorkunitDetails(
              clusterOptions,
              workunit.wuId
            );

            const scopeCount = detailedInfo?.length || 0;
            logOrPostMessage({
              level: 'info',
              text: `Fetched ${scopeCount} scopes for workunit ${workunit.wuId}`,
            });

            // Log memory usage for large workunits
            if (scopeCount > 1000) {
              logMemoryUsage(`after fetching ${scopeCount} scopes`);
            }

            // Process scopes in streaming fashion with smaller chunks
            const CHUNK = 100; // Reduced chunk size for better memory management
            const rows = [];
            let processedScopes = 0;

            // Process scopes one at a time to minimize memory footprint
            for (let i = 0; i < scopeCount; i++) {
              const scope = detailedInfo[i];

              // Convert scope to row
              const row = processScopeToRow(scope, clusterId, workunit.wuId);

              if (row) {
                rows.push(row);
              }

              // Clear the scope reference to allow GC
              detailedInfo[i] = null;
              processedScopes++;

              // Insert when chunk is full
              if (rows.length >= CHUNK) {
                await bulkCreateWithDiagnostics(rows);
                rows.length = 0; // Clear array

                // Aggressive GC on large datasets
                if (
                  global.gc &&
                  scopeCount > 1000 &&
                  processedScopes % 500 === 0
                ) {
                  global.gc();
                }
              }
            }

            // Insert remaining rows
            if (rows.length > 0) {
              await bulkCreateWithDiagnostics(rows);
              rows.length = 0;
            }

            // Clear detailedInfo array completely
            if (detailedInfo) {
              detailedInfo.length = 0;
              detailedInfo = null;
            }

            // Force GC after processing large workunits
            if (scopeCount > 1000) {
              forceGCAndLog(`after GC for ${scopeCount} scopes`);
            }

            logOrPostMessage({
              level: 'info',
              text: `Stored ${processedScopes} scope details for workunit ${workunit.wuId}`,
            });

            // Add to successful list instead of updating immediately
            successfulWuIds.push(workunit.wuId);

            successCount++;
            processedCount++;

            // Add a small delay between requests to be gentle on the HPCC system
            await new Promise(resolve => setTimeout(resolve, 500));

            // Force garbage collection every 3 workunits to manage memory
            if (processedCount % 3 === 0) {
              forceGCAndLog(
                `Memory cleanup after processing ${processedCount} workunits`
              );
            }
          } catch (err) {
            logOrPostMessage({
              level: 'error',
              text: `Error processing workunit ${workunit.wuId}: ${err.message}`,
            });
            processedCount++;

            // Clean up on error
            if (detailedInfo) {
              detailedInfo.length = 0;
              detailedInfo = null;
            }
            if (global.gc) global.gc();
          }
        }

        // Batch update all successful workunits at once
        if (successfulWuIds.length > 0) {
          await WorkUnit.update(
            { detailsFetched: true },
            {
              where: {
                wuId: successfulWuIds,
                clusterId,
              },
            }
          );

          logOrPostMessage({
            level: 'info',
            text: `Marked ${successfulWuIds.length} workunits as details fetched`,
          });
        }

        logOrPostMessage({
          level: 'info',
          text: `Completed processing cluster ${clusterId}: ${successCount}/${processedCount} workunits successful`,
        });
      } catch (err) {
        logOrPostMessage({
          level: 'error',
          text: `Error processing cluster ${clusterDetail.id}: ${err.message}`,
        });
      }
    }

    const executionTime = new Date().getTime() - executionStartTime.getTime();

    // Log summary of out-of-range time values
    logOutOfRangeSummary();

    logOrPostMessage({
      level: 'info',
      text: `WorkUnit Details job completed successfully in ${executionTime}ms`,
    });
  } catch (err) {
    logOrPostMessage({
      level: 'error',
      text: `WorkUnit Details job failed: ${err.message}`,
    });
    throw err;
  }
}

// Run if called directly
(async () => {
  await workunitDetails();
})();

module.exports = {
  workunitDetails,
  fetchWorkunitDetails,
  extractPerformanceMetrics,
  processScopeToRow,
  outOfRangeTimeValues,
};
