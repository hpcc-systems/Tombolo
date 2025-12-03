/**
 * List of all relevant metrics for workunit details
 * @type {string[]}
 */
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

/**
 * Lookup for metric units
 * @type {Object<string, 'nanoseconds'|'percentage'|'bytes'|'int'>}
 */
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

/**
 * Mapping of normalized label prefixes to readable short labels
 * @type {Object<string, string>}
 */
const readableLabels = {
  'grouped keyed join': 'Grouped Keyed Join',
  'filtered csv read': 'Filtered Csv Read',
  'keyed join': 'Keyed Join',
  'filtered projected csv read': 'Filtered Projected Csv Read',
};

/**
 * Normalizes a label by replacing newlines and multiple spaces, then shortens using readableLabels if matched
 * @param {string} label
 * @returns {string}
 */
function normalizeLabel(label) {
  if (!label) return label;
  // Normalize: replace newlines and multiple spaces with a single space
  const normalized = label.replace(/\s+/g, ' ').trim();
  const lower = normalized.toLowerCase();
  for (const prefix in readableLabels) {
    if (lower.startsWith(prefix)) {
      return readableLabels[prefix];
    }
  }
  return label;
}

module.exports = {
  relevantMetrics,
  UNIT_LOOKUP,
  readableLabels,
  normalizeLabel,
};
