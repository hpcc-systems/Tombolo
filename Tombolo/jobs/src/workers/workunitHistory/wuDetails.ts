import { IOptions, Workunit } from '@hpcc-js/comms';
import { getClusters, getClusterOptions } from '@tombolo/core';
import db from '@tombolo/db';
const { WorkUnit, WorkUnitDetails } = db;
import { retryWithBackoff, truncateString } from '@tombolo/shared';
import logger from '../../config/logger.js';

// Type definition for scope objects from HPCC fetchDetails response
// The Scope class has a private _espState property that contains the raw WSDL response
interface ScopeWithState {
  scopeType?: string;
  _espState: {
    Id: string;
    ScopeName: string;
    ScopeType: string;
    Properties: {
      Property: Array<{
        Name: string;
        RawValue: string;
        Formatted?: string;
        Measure?: string;
      }>;
    };
  };
}

// Type for database row objects (what processScopeToRow returns)
type WorkUnitDetailRow = {
  clusterId: string;
  wuId: string;
  scopeId: string;
  scopeName: string;
  scopeType: string;
  label: string | null;
  kind: string | null;
  fileName: string | null;
  [key: string]: string | number | null; // Dynamic metric fields
};

// Constants
const TERMINAL_STATES = ['completed', 'failed', 'aborted'];

// Global array to track out-of-range time values
// TODO: Create a notification for this at some point
// TODO: Create a type for this at some point as well
const outOfRangeTimeValues: any[] = [];

/**
 * Logs current memory usage
 */
function logMemoryUsage(context = '') {
  if (global.gc) {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const externalMB = Math.round(memUsage.external / 1024 / 1024);

    logger.debug({
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

  logger.warn(
    `Found ${outOfRangeTimeValues.length} out-of-range time value(s) during processing`
  );

  // Group by reason
  const byReason = outOfRangeTimeValues.reduce((acc, item) => {
    acc[item.reason] = (acc[item.reason] || 0) + 1;
    return acc;
  }, {});

  logger.info(`Out-of-range breakdown: ${JSON.stringify(byReason)}`);

  // Show examples
  const examples = outOfRangeTimeValues.slice(0, 3);
  examples.forEach(ex => {
    const days = ex.value ? (ex.value / 86400).toFixed(1) : 'N/A';
    logger.info(
      `  Example: ${ex.fieldName} = ${ex.value}s (${days} days) in wuId=${ex.wuId}, reason=${ex.reason}`
    );
  });
}

/**
 * Logs detailed statistics for a column across a batch
 */
function logBatchStatistics(columnName: string, batch: WorkUnitDetailRow[]) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let negativeCount = 0;
  const samples = [];

  for (let i = 0; i < batch.length; i++) {
    const v = batch[i][columnName];
    if (v !== undefined && v !== null && typeof v === 'number') {
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

  logger.error(
    `${columnName} stats across batch: min=${min === Number.POSITIVE_INFINITY ? 'n/a' : min}, max=${max === Number.NEGATIVE_INFINITY ? 'n/a' : max}, negativeCount=${negativeCount}, samples=${JSON.stringify(samples)}`
  );
}

/**
 * Logs detailed error information for out-of-range database errors
 */
function logOutOfRangeError(error: Error, batch: WorkUnitDetailRow[]) {
  // Extract the column name from error message
  // e.g., "Out of range value for column 'TimeLocalExecute' at row 24"
  const columnMatch = error.message.match(/column '(\w+)'/);
  const rowMatch = error.message.match(/row (\d+)/);
  const columnName = columnMatch ? columnMatch[1] : 'unknown';
  const rowNum = rowMatch ? parseInt(rowMatch[1], 10) - 1 : -1;

  const errorMsg = `Out of range error for column '${columnName}' at row ${rowNum + 1}/${batch.length}`;
  logger.error(errorMsg);

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

    logger.error(rowDetails);

    // Log ALL values for Time* fields in this row for debugging
    if (columnName.startsWith('Time')) {
      const timeFields = Object.keys(problematicRow).filter(k =>
        k.startsWith('Time')
      );
      const timeValues: Record<string, string | number | null> = {};
      timeFields.forEach(field => {
        const val = problematicRow[field];
        if (val !== null && val !== undefined) {
          timeValues[field] = val;
        }
      });
      const timeValuesStr = JSON.stringify(timeValues, null, 2);
      logger.error(`All Time* values in this row: ${timeValuesStr}`);
    }
  }
  console.error('='.repeat(80) + '\n');

  // Log statistics across entire batch
  logBatchStatistics(columnName, batch);
}

/**
 * Attempts to bulk create records with detailed error diagnostics
 */
async function bulkCreateWithDiagnostics(batch: WorkUnitDetailRow[]) {
  try {
    // Dynamic metric fields don't match static Sequelize type, but structure is compatible
    // @ts-expect-error - WorkUnitDetailRow has dynamic metric fields that are compatible at runtime
    await WorkUnitDetails.bulkCreate(batch, {
      ignoreDuplicates: true, // Skip duplicates instead of updating (no timestamps to update)
      logging: false,
    });
  } catch (e: unknown) {
    // Enhanced diagnostics for out of range errors
    if (
      e instanceof Error &&
      e.name === 'SequelizeDatabaseError' &&
      e.message.toLowerCase().includes('out of range')
    ) {
      try {
        logOutOfRangeError(e, batch);
      } catch (diagError: unknown) {
        logger.error(`Diagnostic error: ${String(diagError)}`);
      }
    } else {
      // Log error details for non-out-of-range errors
      logger.error(`bulkCreate error: ${String(e)}`);
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
] as const;

type MetricName = (typeof relevantMetrics)[number];

const UNIT_LOOKUP: Record<
  MetricName,
  'nanoseconds' | 'percentage' | 'bytes' | 'int'
> = {
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
function extractPerformanceMetrics(
  scope: ScopeWithState,
  clusterId: string,
  wuId: string
) {
  const metrics = {};

  if (!scope._espState?.Properties?.Property) return metrics;

  const st = scope.scopeType || scope._espState?.ScopeType;
  const currentRelevantMetrics =
    st === 'activity' ? relevantActivityMetricsSet : relevantMetricsSet;

  // DECIMAL(13,6) max value: 9999999.999999 seconds (~115.7 days)
  const MAX_DECIMAL_13_6 = 9999999.999999;

  // Unit lookup and converters

  const convertByUnit = (name: string, raw: string | undefined) => {
    if (raw === undefined || raw === null) return null;

    // Coerce numeric strings to numbers
    let num: string | number = raw;
    if (typeof num === 'string' && num.trim() !== '' && !isNaN(Number(num))) {
      num = Number(num);
    }
    if (typeof num !== 'number' || !isFinite(num)) return null;

    const unit = UNIT_LOOKUP[name as MetricName];
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

          logger.warn(
            `Out-of-range time value detected: ${name} = ${rounded}s (negative value, likely clock skew) in wuId=${wuId}, clusterId=${clusterId}`
          );

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

          logger.warn(
            `Out-of-range time value detected: ${name} = ${rounded}s (${days} days, exceeds max ${MAX_DECIMAL_13_6}s) in wuId=${wuId}, clusterId=${clusterId}`
          );

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
    if (currentRelevantMetrics.has(prop.Name as MetricName)) {
      const value =
        prop.RawValue !== undefined ? prop.RawValue : prop.Formatted;
      const converted = convertByUnit(prop.Name, value);
      if (converted !== null) {
        (metrics as Record<string, number>)[prop.Name] = converted;
      }
    }
  });

  return metrics;
}

/**
 * Processes a single scope and converts it to a DB row
 * Returns null if scope should be filtered out
 */
function processScopeToRow(
  scope: ScopeWithState,
  clusterId: string,
  wuId: string
) {
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

  // Always truncate filename if it exists, regardless of label
  const truncatedFileName = filename ? truncateString(filename, 125) : null;

  return {
    clusterId,
    wuId,
    scopeId: scope._espState?.Id,
    scopeName: scopeName,
    scopeType: scopeType,
    label: label ? truncateString(label, 250) : null,
    kind: kind || null,
    fileName: truncatedFileName,
    ...metrics,
  };
}

/**
 * Fetches workunit details with retry logic
 */
async function fetchWorkunitDetails(clusterOptions: IOptions, wuId: string) {
  return await retryWithBackoff(async () => {
    try {
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
    } catch (err: unknown) {
      // Don't retry if workunit cannot be opened (deleted, archived, or inaccessible)
      // This will be caught and handled in the main loop where we mark clusterDeleted
      if (
        err instanceof Error &&
        err.message &&
        err.message.toLowerCase().includes('cannot open workunit')
      ) {
        const nonRetryableError = new Error(err.message);
        // @ts-expect-error Writing non standard key to Error object
        nonRetryableError.noRetry = true;
        throw nonRetryableError;
      }
      throw err;
    }
  });
}

/**
 * Main function to fetch and store workunit details
 */
async function getWorkunitDetails() {
  const executionStartTime = new Date();

  logger.info('Starting WorkUnit Details job');

  try {
    // Get all cluster details
    let clusterDetails = [];
    try {
      clusterDetails = await getClusters(null);
    } catch (err) {
      logger.error(`Error getting clusters: ${String(err)}`);
      return;
    }

    if (!clusterDetails || clusterDetails.length === 0) {
      logger.info('No clusters found to process');
      return;
    }

    logger.info(`Processing ${clusterDetails.length} cluster(s)`);

    // Process each cluster
    for (const clusterDetail of clusterDetails) {
      try {
        if ('error' in clusterDetail) {
          logger.error(
            `Failed to get cluster ${clusterDetail.id}: ${clusterDetail.error}, skipping`
          );
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

        logger.info(`Processing cluster ${clusterId} (${thorHost})`);

        // Get WorkUnits with terminal states and detailsFetchedAt IS NULL, limit to 20
        const workunitsToProcess = await WorkUnit.findAll({
          where: {
            clusterId,
            state: TERMINAL_STATES,
            detailsFetchedAt: null,
            clusterDeleted: false, // Only process workunits that still exist on cluster
          },
          limit: 20,
          order: [['workUnitTimestamp', 'ASC']], // Process oldest first
          raw: true,
        });

        if (!workunitsToProcess || workunitsToProcess.length === 0) {
          logger.info(
            `No workunits requiring detail processing found for cluster ${clusterId}`
          );

          continue;
        }

        logger.info(
          `Found ${workunitsToProcess.length} workunits to process for cluster ${clusterId}`
        );

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
            logger.info(
              `[${processedCount + 1}/${workunitsToProcess.length}] Processing workunit ${workunit.wuId} for cluster ${clusterId}`
            );

            // Fetch detailed performance data (raw scopes)
            detailedInfo = await fetchWorkunitDetails(
              clusterOptions,
              workunit.wuId
            );

            const scopeCount = detailedInfo?.length || 0;
            logger.info(
              `Fetched ${scopeCount} scopes for workunit ${workunit.wuId}`
            );

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

              // Convert scope to row (cast to access internal _espState)
              const row = processScopeToRow(
                scope as unknown as ScopeWithState,
                clusterId,
                workunit.wuId
              );

              if (row) {
                rows.push(row);
              }

              // Clear the scope reference to allow GC
              (detailedInfo as unknown[])[i] = null;
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

            logger.info(
              `Stored ${processedScopes} scope details for workunit ${workunit.wuId}`
            );

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
          } catch (err: unknown) {
            // Check if workunit was deleted from cluster
            if (
              err instanceof Error &&
              err.message &&
              err.message.toLowerCase().includes('cannot open workunit')
            ) {
              logger.warn(
                `Workunit ${workunit.wuId} has been deleted from cluster, marking as clusterDeleted`
              );

              // Mark workunit as deleted on cluster
              await WorkUnit.update(
                { clusterDeleted: true },
                {
                  where: {
                    wuId: workunit.wuId,
                    clusterId,
                  },
                }
              );
            } else {
              logger.error(
                `Error processing workunit ${workunit.wuId}: ${String(err)}`
              );
            }

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
            { detailsFetchedAt: new Date() },
            {
              where: {
                wuId: successfulWuIds,
                clusterId,
              },
            }
          );

          logger.info(
            `Marked ${successfulWuIds.length} workunits as details fetched`
          );
        }

        logger.info(
          `Completed processing cluster ${clusterId}: ${successCount}/${processedCount} workunits successful`
        );
      } catch (err: unknown) {
        logger.error(
          `Error processing cluster ${clusterDetail.id}: ${String(err)}`
        );
      }
    }

    const executionTime = new Date().getTime() - executionStartTime.getTime();

    // Log summary of out-of-range time values
    logOutOfRangeSummary();

    logger.info(
      `WorkUnit Details job completed successfully in ${executionTime}ms`
    );
  } catch (err: unknown) {
    logger.error(`WorkUnit Details job failed: ${String(err)}`);
    throw err;
  }
}

export {
  getWorkunitDetails,
  fetchWorkunitDetails,
  extractPerformanceMetrics,
  processScopeToRow,
  outOfRangeTimeValues,
};
