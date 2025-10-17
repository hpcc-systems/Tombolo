const { Workunit } = require('@hpcc-js/comms');
const { logOrPostMessage } = require('../jobUtils');
const { getClusterOptions } = require('../../utils/getClusterOptions');
const { getClusters } = require('../../utils/hpcc-util');
const { WorkUnit, WorkUnitDetails } = require('../../models');

// Constants
const TERMINAL_STATES = ['completed', 'failed', 'aborted'];

// Key performance metrics we care about - including all statistical variants
const relevantMetrics = [
  // Time-based metrics
  'TimeElapsed',
  'TimeAvgElapsed',
  'TimeMinElapsed',
  'TimeMaxElapsed',
  'TimeDeltaElapsed',
  'TimeStdDevElapsed',
  'TimeLocalExecute',
  'TimeAvgLocalExecute',
  'TimeMinLocalExecute',
  'TimeMaxLocalExecute',
  'TimeDeltaLocalExecute',
  'TimeStdDevLocalExecute',
  'TimeTotalExecute',
  'TimeAvgTotalExecute',
  'TimeMinTotalExecute',
  'TimeMaxTotalExecute',
  'TimeDeltaTotalExecute',
  'TimeStdDevTotalExecute',
  'TimeDiskReadIO',
  'TimeAvgDiskReadIO',
  'TimeMinDiskReadIO',
  'TimeMaxDiskReadIO',
  'TimeDeltaDiskReadIO',
  'TimeStdDevDiskReadIO',
  'TimeDiskWriteIO',
  'TimeAvgDiskWriteIO',
  'TimeMinDiskWriteIO',
  'TimeMaxDiskWriteIO',
  'TimeDeltaDiskWriteIO',
  'TimeStdDevDiskWriteIO',
  'TimeBlocked',
  'TimeAvgBlocked',
  'TimeMinBlocked',
  'TimeMaxBlocked',
  'TimeDeltaBlocked',
  'TimeStdDevBlocked',
  'TimeLookAhead',
  'TimeAvgLookAhead',
  'TimeMinLookAhead',
  'TimeMaxLookAhead',
  'TimeDeltaLookAhead',
  'TimeStdDevLookAhead',
  'TimeFirstRow',
  'TimeDeltaFirstRow',

  // Disk I/O metrics
  'NumDiskRowsRead',
  'NumAvgDiskRowsRead',
  'NumMinDiskRowsRead',
  'NumMaxDiskRowsRead',
  'NumDeltaDiskRowsRead',
  'NumStdDevDiskRowsRead',
  'SizeDiskRead',
  'SizeAvgDiskRead',
  'SizeMinDiskRead',
  'SizeMaxDiskRead',
  'SizeDeltaDiskRead',
  'SizeStdDevDiskRead',
  'NumDiskReads',
  'NumAvgDiskReads',
  'NumMinDiskReads',
  'NumMaxDiskReads',
  'SizeDiskWrite',
  'SizeAvgDiskWrite',
  'SizeMinDiskWrite',
  'SizeMaxDiskWrite',
  'SizeDeltaDiskWrite',
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
  'SizePeakMemory',
  'SizeAvgPeakMemory',
  'SizeMinPeakMemory',
  'SizeMaxPeakMemory',

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

  // Row processing metrics
  'RowsProcessed',
  'RowsAvgProcessed',
  'RowsMinProcessed',
  'RowsMaxProcessed',
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

const activityIgnoreMetrics = ['FirstRow', 'NodeMin', 'NodeMax'];

const relevantActivityMetrics = relevantMetrics.filter(
  metric =>
    !activityIgnoreMetrics.some(ignoreSubstring =>
      metric.includes(ignoreSubstring)
    )
);

/**
 * Extracts performance metrics from a scope's properties
 */
function extractPerformanceMetrics(scope) {
  const metrics = {};

  if (!scope._espState?.Properties?.Property) return metrics;

  const currentRelevantMetrics =
    scope.scopeType === 'activity' ? relevantActivityMetrics : relevantMetrics;

  // Extract properties into clean metrics object
  scope._espState.Properties.Property.forEach(prop => {
    if (currentRelevantMetrics.includes(prop.Name)) {
      // Use RawValue if available (numeric), otherwise use Formatted
      const value =
        prop.RawValue !== undefined ? prop.RawValue : prop.Formatted;

      // Try to convert to number if it's a string number
      let cleanValue = value;
      if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
        cleanValue = parseFloat(value);
      }

      metrics[prop.Name] = cleanValue;
    }
  });

  return metrics;
}

/**
 * Processes fetchDetails response to extract only performance-relevant data
 */
function processPerformanceData(detailedInfo) {
  const performanceData = [];

  detailedInfo.forEach(scope => {
    // Only process scopes that typically have performance data
    const relevantScopeTypes = ['activity', 'subgraph', 'graph', 'operation'];
    const scopeType = scope._espState?.ScopeType;
    const scopeName = scope._espState?.ScopeName;

    if (!relevantScopeTypes.includes(scopeType)) return;

    // Skip scopes that start with ">compile" (compiler stats)
    if (scopeName && scopeName.startsWith('>compile')) return;

    const metrics = extractPerformanceMetrics(scope);

    // Only include scopes that have performance metrics
    if (Object.keys(metrics).length > 0) {
      // Extract Kind and Label for better activity identification
      let kind;
      let label;
      let filename;

      if (scope._espState?.Properties?.Property) {
        scope._espState.Properties.Property.forEach(prop => {
          if (prop.Name === 'Kind') {
            kind = prop.RawValue || prop.Formatted;
          } else if (prop.Name === 'Label') {
            label = prop.RawValue || prop.Formatted;
          } else if (prop.Name === 'Filename') {
            filename = prop.RawValue || prop.Formatted;
          }
        });
      }

      // Only include filename if this is a Disk Read activity
      const shouldIncludeFilename = label && label.includes('Disk Read');

      // Get human-readable kind name
      // const kindName = kind ? getActivityKindName(kind) : undefined;

      const scopeData = {
        scopeId: scope._espState.Id,
        scopeName: scope._espState.ScopeName,
        scopeType: scope._espState.ScopeType,
        properties: {
          label: label,
          kind: kind,
          fileName: shouldIncludeFilename && filename ? filename : null,
          metrics: metrics,
        },
      };

      performanceData.push(scopeData);
    }
  });

  return performanceData;
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 3, delay = 2000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }

      const backoffDelay = delay * Math.pow(2, attempt);
      logOrPostMessage({
        level: 'warn',
        text: `Attempt ${attempt + 1} failed: ${err.message}. Retrying in ${backoffDelay}ms...`,
      });

      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}

/**
 * Fetches workunit details with retry logic
 * @param {Object} clusterOptions - HPCC cluster connection options
 * @param {string} wuId - Workunit ID
 * @returns {Promise<Array>} Array of scope performance data
 */
async function fetchWorkunitDetails(clusterOptions, wuId) {
  return await retryWithBackoff(async () => {
    // Attach to workunit and fetch performance data
    const attachedWu = Workunit.attach(clusterOptions, wuId);

    // Optimized fetchDetails call - only get performance-relevant scopes and properties
    const detailedInfo = await attachedWu.fetchDetails({
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
        IncludeFormatted: true,
        IncludeMeasure: true,
        IncludeCreator: false,
        IncludeCreatorType: false,
      },
      PropertiesToReturn: {
        AllStatistics: true, // This gets TimeElapsed, etc.
        AllProperties: true, // Need this for Kind, Label, Filename, etc.
        AllAttributes: false, // Reduces noise
        AllHints: false, // Reduces noise
        AllNotes: false, // Reduces noise
        AllScopes: true,
      },
    });

    return processPerformanceData(detailedInfo);
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
          limit: 25,
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

        // Process each workunit
        for (const workunit of workunitsToProcess) {
          try {
            logOrPostMessage({
              level: 'info',
              text: `[${processedCount + 1}/${workunitsToProcess.length}] Processing workunit ${workunit.wuId} for cluster ${clusterId}`,
            });

            // Fetch detailed performance data
            const performanceData = await fetchWorkunitDetails(
              clusterOptions,
              workunit.wuId
            );

            // Store each scope as a separate record in WorkUnitDetails
            if (performanceData && performanceData.length > 0) {
              const detailRecords = performanceData.map(scope => ({
                clusterId,
                wuId: workunit.wuId,
                scopeId: scope.scopeId,
                scopeName: scope.scopeName,
                scopeType: scope.scopeType,
                properties: scope.properties,
              }));

              // Bulk insert detail records
              await WorkUnitDetails.bulkCreate(detailRecords, {
                updateOnDuplicate: ['properties', 'updatedAt'],
              });

              logOrPostMessage({
                level: 'info',
                text: `Stored ${detailRecords.length} scope details for workunit ${workunit.wuId}`,
              });
            }

            // Mark workunit as details fetched
            await WorkUnit.update(
              { detailsFetched: true },
              {
                where: {
                  wuId: workunit.wuId,
                  clusterId,
                },
              }
            );

            successCount++;
            processedCount++;

            // Add a small delay between requests to be gentle on the HPCC system
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Force garbage collection every 5 workunits to manage memory
            if (processedCount % 5 === 0 && global.gc) {
              global.gc();
              logOrPostMessage({
                level: 'info',
                text: `Memory cleanup after processing ${processedCount} workunits`,
              });
            }
          } catch (err) {
            logOrPostMessage({
              level: 'error',
              text: `Error processing workunit ${workunit.wuId}: ${err.message}`,
            });
            processedCount++;
          }
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
  processPerformanceData,
  extractPerformanceMetrics,
  retryWithBackoff,
};
