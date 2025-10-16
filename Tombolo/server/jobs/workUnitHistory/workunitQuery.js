const { Workunit } = require('@hpcc-js/comms');
const { logOrPostMessage } = require('../jobUtils');
const { getClusterOptions } = require('../../utils/getClusterOptions');
const { getClusters } = require('../../utils/hpcc-util');
const {
  MonitoringType,
  MonitoringLog,
  WorkUnitHistory,
} = require('../../models');

// Constants
const MONITORING_TYPE_NAME = 'WorkUnit History';

/**
 * Gets the start and end time for fetching workunits
 * @param {string|null} lastScanTime - Last scan time from monitoring log
 * @param {boolean} toIso - Whether to return ISO strings
 * @returns {{startTime: string|Date, endTime: string|Date}}
 */
function getStartAndEndTime(lastScanTime, toIso = false) {
  const now = new Date();
  let startTime;

  if (lastScanTime) {
    // Start from beginning of the day of last scan to ensure no gaps
    const lastScan = new Date(lastScanTime);
    startTime = new Date(
      lastScan.getFullYear(),
      lastScan.getMonth(),
      lastScan.getDate()
    );
  } else {
    // If no previous scan, start from beginning of today
    startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  return {
    startTime: toIso ? startTime.toISOString() : startTime,
    endTime: toIso ? now.toISOString() : now,
  };
}

/**
 * Parses workunit timestamp from wuId and applies timezone offset
 * @param {string} wuId - The workunit ID
 * @param {number} timezoneOffset - Timezone offset in minutes
 * @returns {Date} Parsed and adjusted timestamp
 */
function parseWorkunitTimestamp(wuId, timezoneOffset = 0) {
  try {
    // Handle workunit ID format: W[YYYYMMDD]-[HHMMSS]-[SEQUENCE]
    // Extract just the date/time part, ignoring the sequence number
    const wuIdMatch = wuId.match(/^W(\d{8})-(\d{6})-?\d*$/);

    if (!wuIdMatch) {
      throw new Error(`Invalid WUID format: ${wuId}`);
    }

    const [, dateStr, timeStr] = wuIdMatch;

    // Parse date: YYYYMMDD
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(dateStr.substring(6, 8));

    // Parse time: HHMMSS
    const hour = parseInt(timeStr.substring(0, 2));
    const minute = parseInt(timeStr.substring(2, 4));
    const second = parseInt(timeStr.substring(4, 6));

    // Create timestamp
    let timestamp = new Date(year, month, day, hour, minute, second);

    // Apply timezone offset if not 0
    if (timezoneOffset !== 0) {
      timestamp = new Date(timestamp.getTime() + timezoneOffset * 60 * 1000);
    }

    return timestamp;
  } catch (err) {
    logOrPostMessage({
      level: 'warn',
      text: `Failed to parse timestamp from wuId ${wuId}: ${err.message}`,
    });
    // Fallback to current time if parsing fails
    return new Date();
  }
}

/**
 * Transforms workunit data to match WorkUnitHistory model structure
 * @param {Object} workunit - Raw workunit data from HPCC
 * @param {string} clusterId - Cluster ID
 * @param {number} timezoneOffset - Timezone offset in minutes
 * @returns {Object} Transformed workunit data
 */
function transformWorkunitData(workunit, clusterId, timezoneOffset = 0) {
  const executeCost = parseFloat(workunit.ExecuteCost) || 0.0;
  const fileAccessCost = parseFloat(workunit.FileAccessCost) || 0.0;
  const compileCost = parseFloat(workunit.CompileCost) || 0.0;
  const totalCost = executeCost + fileAccessCost + compileCost;

  return {
    wuId: workunit.Wuid,
    clusterId,
    workUnitTimestamp: parseWorkunitTimestamp(workunit.Wuid, timezoneOffset),
    owner: workunit.Owner || 'unknown',
    engine: workunit.Cluster || 'unknown',
    jobName: workunit.Jobname || null,
    stateId: workunit.StateID || 0,
    state: workunit.State || 'unknown',
    protected: workunit.Protected === true || workunit.Protected === 'true',
    action: workunit.Action || 0,
    actionEx: workunit.ActionEx || null,
    isPausing: workunit.IsPausing === true || workunit.IsPausing === 'true',
    thorLcr: workunit.ThorLCR === true || workunit.ThorLCR === 'true',
    totalClusterTime: parseFloat(workunit.TotalClusterTime) || 0.0,
    executeCost,
    fileAccessCost,
    compileCost,
    totalCost,
  };
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
 * Fetches a single page of workunits with retry logic
 * @param {Object} clusterOptions - HPCC cluster connection options
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @param {number} pageStartFrom - Starting index for pagination
 * @param {number} pageSize - Number of records per page
 * @returns {Object} Response containing workunits and pagination info
 */
async function fetchWorkunitPage(
  clusterOptions,
  startDate,
  endDate,
  pageStartFrom = 0,
  pageSize = 250
) {
  return await retryWithBackoff(async () => {
    const response = await Workunit.query(clusterOptions, {
      StartDate: startDate,
      EndDate: endDate,
      PageStartFrom: pageStartFrom,
      PageSize: pageSize,
    });

    return (
      response || { Workunits: [], NumWUs: 0, PageStartFrom: 0, PageEndAt: 0 }
    );
  });
}

/**
 * Fetches all workunits from a cluster within a date range using pagination
 * @param {Object} clusterOptions - HPCC cluster connection options
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @param {string} clusterId - Cluster ID for logging
 * @returns {Array} Array of workunit data
 */
async function getWorkUnits(clusterOptions, startDate, endDate, clusterId) {
  const pageSize = 250;
  let allWorkunits = [];
  let pageStartFrom = 0;
  let totalFetched = 0;

  try {
    while (true) {
      logOrPostMessage({
        level: 'info',
        text: `Fetching workunits page starting from ${pageStartFrom} for cluster ${clusterId}`,
      });

      const response = await fetchWorkunitPage(
        clusterOptions,
        startDate,
        endDate,
        pageStartFrom,
        pageSize
      );

      const workunits = response.Workunits || [];

      if (workunits.length === 0) {
        break;
      }

      allWorkunits = allWorkunits.concat(workunits);
      totalFetched += workunits.length;

      logOrPostMessage({
        level: 'info',
        text: `Fetched ${workunits.length} workunits (total: ${totalFetched}) for cluster ${clusterId}`,
      });

      // Check if we've reached the end
      if (workunits.length < pageSize) {
        break;
      }

      pageStartFrom += pageSize;

      // Add a small delay between requests to be gentle on the HPCC system
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logOrPostMessage({
      level: 'info',
      text: `Completed fetching all ${totalFetched} workunits for cluster ${clusterId}`,
    });

    return allWorkunits;
  } catch (err) {
    logOrPostMessage({
      level: 'error',
      text: `Error fetching workunits for cluster ${clusterId}: ${err.message}`,
    });
    throw err;
  }
}

/**
 * Handles monitoring log operations
 * @param {string|null} monitoringLog - Existing monitoring log
 * @param {string} clusterId - Cluster ID
 * @param {string} monitoringTypeId - Monitoring type ID
 * @param {Date} scanTime - Current scan time
 */
async function handleMonitoringLog(
  monitoringLog,
  clusterId,
  monitoringTypeId,
  scanTime
) {
  try {
    if (monitoringLog) {
      await MonitoringLog.update(
        { scan_time: scanTime },
        {
          where: {
            cluster_id: clusterId,
            monitoring_type_id: monitoringTypeId,
          },
        }
      );
    } else {
      await MonitoringLog.create({
        cluster_id: clusterId,
        monitoring_type_id: monitoringTypeId,
        scan_time: scanTime,
      });
    }
  } catch (err) {
    logOrPostMessage({
      level: 'error',
      text: `Error handling monitoring log for cluster ${clusterId}: ${err.message}`,
    });
    throw err;
  }
}

/**
 * Main function to fetch and store workunit history
 */
async function workunitQuery() {
  const executionStartTime = new Date();

  logOrPostMessage({
    level: 'info',
    text: 'Starting WorkUnit History job',
  });

  try {
    // Get monitoring type for 'WorkUnit History'
    const monitoringType = await MonitoringType.findOne({
      where: { name: MONITORING_TYPE_NAME },
      raw: true,
    });

    if (!monitoringType) {
      throw new Error(`Monitoring type '${MONITORING_TYPE_NAME}' not found`);
    }

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
          timezone_offset: timezoneOffset = 0,
          allowSelfSigned,
        } = clusterDetail;

        logOrPostMessage({
          level: 'info',
          text: `Processing cluster ${clusterId} (${thorHost})`,
        });

        // Get monitoring log for this cluster
        const monitoringLog = await MonitoringLog.findOne({
          where: {
            cluster_id: clusterId,
            monitoring_type_id: monitoringType.id,
          },
          raw: true,
        });

        // Determine start and end dates
        const { startTime, endTime } = getStartAndEndTime(
          monitoringLog ? monitoringLog.scan_time : null,
          true
        );

        logOrPostMessage({
          level: 'info',
          text: `Fetching workunits for cluster ${clusterId} from ${startTime} to ${endTime}`,
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

        // Fetch workunits from cluster
        const workunits = await getWorkUnits(
          clusterOptions,
          startTime,
          endTime,
          clusterId
        );

        if (!workunits || workunits.length === 0) {
          logOrPostMessage({
            level: 'info',
            text: `No workunits found for cluster ${clusterId}`,
          });

          // Update monitoring log even if no workunits found
          await handleMonitoringLog(
            monitoringLog,
            clusterId,
            monitoringType.id,
            executionStartTime
          );
          continue;
        }

        logOrPostMessage({
          level: 'info',
          text: `Found ${workunits.length} workunits for cluster ${clusterId}`,
        });

        // Transform workunits for database insertion
        const transformedWorkunits = workunits.map(wu =>
          transformWorkunitData(wu, clusterId, timezoneOffset)
        );

        // Bulk insert workunits
        await WorkUnitHistory.bulkCreate(transformedWorkunits, {
          updateOnDuplicate: [
            'workUnitTimestamp',
            'owner',
            'engine',
            'jobName',
            'stateId',
            'state',
            'protected',
            'action',
            'actionEx',
            'isPausing',
            'thorLcr',
            'totalClusterTime',
            'executeCost',
            'fileAccessCost',
            'compileCost',
            'totalCost',
            'updatedAt',
          ],
        });

        logOrPostMessage({
          level: 'info',
          text: `Successfully inserted/updated ${transformedWorkunits.length} workunits for cluster ${clusterId}`,
        });

        // Update monitoring log
        await handleMonitoringLog(
          monitoringLog,
          clusterId,
          monitoringType.id,
          executionStartTime
        );
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
      text: `WorkUnit History job completed successfully in ${executionTime}ms`,
    });
  } catch (err) {
    logOrPostMessage({
      level: 'error',
      text: `WorkUnit History job failed: ${err.message}`,
    });
    throw err;
  }
}

(async () => {
  await workunitQuery();
})();

module.exports = {
  getWorkUnits,
  getWorkUnitHistory: workunitQuery,
  parseWorkunitTimestamp,
  transformWorkunitData,
  retryWithBackoff,
  fetchWorkunitPage,
};
