import { IOptions, Workunit } from '@hpcc-js/comms';
import { getClusters, getClusterOptions } from '@tombolo/core';
import db from '@tombolo/db';
import type {
  MonitoringLogAttributes,
  MonitoringLogInstance,
} from '@tombolo/db';
const { MonitoringType, MonitoringLog, WorkUnit } = db;
import { retryWithBackoff } from '@tombolo/shared';
import { parseWorkunitTimestamp } from '@tombolo/shared';
import logger from '../../config/logger.js';

// Type for HPCC workunit with _espState access
interface WorkunitWithState {
  _espState?: {
    Wuid: string;
    Owner?: string;
    Cluster?: string;
    Jobname?: string;
    StateID?: number;
    State?: string;
    Protected?: boolean | string;
    Action?: number;
    ActionEx?: string;
    IsPausing?: boolean | string;
    ThorLCR?: boolean | string;
    TotalClusterTime?: string;
    ExecuteCost?: string;
    FileAccessCost?: string;
    CompileCost?: string;
  };
  // Allow direct property access as fallback
  [key: string]: unknown;
}

// Constants
const MONITORING_TYPE_NAME = 'WorkUnit History';

/**
 * Gets the start and end time for fetching workunits
 * Always queries from start of current day (UTC) to now
 * @param {boolean} toIso - Whether to return ISO strings
 */
function getStartAndEndTime(toIso = false): {
  startTime: string | Date;
  endTime: string | Date;
} {
  const now = new Date();

  // Always start from beginning of current day in UTC
  const startTime = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  return {
    startTime: toIso ? startTime.toISOString() : startTime,
    endTime: toIso ? now.toISOString() : now,
  };
}

/**
 * Transforms workunit data to match WorkUnitHistory model structure
 * @param workunit - Raw workunit data from HPCC
 * @param clusterId - Cluster ID
 * @param timezoneOffset - Timezone offset in minutes
 * @returns {Object} Transformed workunit data
 */
function transformWorkunitData(
  workunit: WorkunitWithState,
  clusterId: string,
  timezoneOffset = 0
) {
  // Extract data from _espState property
  const wuData = workunit._espState || workunit;

  const executeCost = parseFloat(String(wuData.ExecuteCost || 0)) || 0.0;
  const fileAccessCost = parseFloat(String(wuData.FileAccessCost || 0)) || 0.0;
  const compileCost = parseFloat(String(wuData.CompileCost || 0)) || 0.0;
  const totalCost = executeCost + fileAccessCost + compileCost;

  return {
    wuId: String(wuData.Wuid),
    clusterId,
    workUnitTimestamp: parseWorkunitTimestamp(
      String(wuData.Wuid),
      timezoneOffset
    ),
    owner: String(wuData.Owner || 'unknown'),
    engine: String(wuData.Cluster || 'unknown'),
    jobName: wuData.Jobname ? String(wuData.Jobname) : null,
    stateId: Number(wuData.StateID) || 0,
    state: String(wuData.State || 'unknown'),
    protected: wuData.Protected === true || wuData.Protected === 'true',
    action: Number(wuData.Action) || 0,
    actionEx: wuData.ActionEx ? String(wuData.ActionEx) : null,
    isPausing: wuData.IsPausing === true || wuData.IsPausing === 'true',
    thorLcr: wuData.ThorLCR === true || wuData.ThorLCR === 'true',
    totalClusterTime: parseFloat(String(wuData.TotalClusterTime || 0)) || 0.0,
    executeCost,
    fileAccessCost,
    compileCost,
    totalCost,
  };
}

/**
 * Fetches a single page of workunits with retry logic
 * @param clusterOptions - HPCC cluster connection options
 * @param startDate - Start date in ISO format
 * @param endDate - End date in ISO format
 * @param pageStartFrom - Starting index for pagination
 * @param pageSize - Number of records per page
 * @returns {Promise<Object>} Response containing workunits and pagination info
 */
async function fetchWorkunitPage(
  clusterOptions: IOptions,
  startDate: string,
  endDate: string,
  pageStartFrom = 0,
  pageSize = 250
) {
  return await retryWithBackoff(async () => {
    const workunits = await Workunit.query(clusterOptions, {
      StartDate: startDate,
      EndDate: endDate,
      PageStartFrom: pageStartFrom,
      PageSize: pageSize,
    });

    // Workunit.query returns an array directly, not a response object
    return {
      Workunits: workunits || [],
      NumWUs: (workunits || []).length,
      PageStartFrom: pageStartFrom,
      PageEndAt: pageStartFrom + (workunits || []).length - 1,
    };
  });
}

/**
 * Fetches all workunits from a cluster within a date range using pagination
 * Transforms and inserts them into the database
 * @param clusterOptions - HPCC cluster connection options
 * @param startDate - Start date in ISO format
 * @param endDate - End date in ISO format
 * @param clusterId - Cluster ID for logging (UUID)
 * @param timezoneOffset - Timezone offset in minutes
 * @returns Stats about processed workunits {totalFetched, totalInserted}
 */
async function getWorkUnits(
  clusterOptions: IOptions,
  startDate: string,
  endDate: string,
  clusterId: string,
  timezoneOffset = 0
): Promise<{ totalFetched: number; totalInserted: number }> {
  const pageSize = 250;
  let pageStartFrom = 0;
  let totalFetched = 0;
  let totalInserted = 0;

  try {
    while (true) {
      logger.info(
        `Fetching workunits page starting from ${pageStartFrom} for cluster ${clusterId}`
      );

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

      totalFetched += workunits.length;

      // Transform and insert immediately
      const transformedWorkunits = workunits.map(wu =>
        transformWorkunitData(
          wu as unknown as WorkunitWithState,
          clusterId,
          timezoneOffset
        )
      );

      // Sequelize will auto-populate createdAt, updatedAt, and set clusterDeleted default
      // @ts-expect-error - Sequelize handles missing timestamp and default fields
      await WorkUnit.bulkCreate(transformedWorkunits, {
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

      totalInserted += transformedWorkunits.length;

      logger.info(
        `Processed ${totalFetched} workunits (inserted/updated: ${totalInserted}) for cluster ${clusterId}`
      );

      // Check if we've reached the end
      if (workunits.length < pageSize) {
        break;
      }

      pageStartFrom += pageSize;

      // Add a small delay between requests to be gentle on the HPCC system
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logger.info(
      `Completed processing ${totalFetched} workunits for cluster ${clusterId}`
    );

    return { totalFetched, totalInserted };
  } catch (err) {
    logger.error(
      `Error fetching workunits for cluster ${clusterId}: ${String(err)}`
    );
    throw err;
  }
}

/**
 * Handles monitoring log operations
 * @param monitoringLog - Existing monitoring log
 * @param clusterId - Cluster ID (UUID)
 * @param monitoringTypeId - Monitoring type ID (UUID)
 * @param scanTime - Current scan time
 */
async function handleMonitoringLog(
  monitoringLog: MonitoringLogInstance | null,
  clusterId: string,
  monitoringTypeId: string,
  scanTime: Date
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
      } as MonitoringLogAttributes);
    }
  } catch (err) {
    logger.error(
      `Error handling monitoring log for cluster ${clusterId}: ${String(err)}`
    );
    throw err;
  }
}

/**
 * Main function to fetch and store workunit history
 */
async function workunitQuery() {
  const executionStartTime = new Date();

  logger.info('Starting WorkUnit History job');

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
    } catch (err: unknown) {
      logger.error(`Error getting clusters: ${String(err)}`);
      return;
    }

    if (!clusterDetails || clusterDetails.length === 0) {
      logger.info('No clusters found to process');
      return;
    }

    logger.info(`Processing ${clusterDetails.length} cluster(s)`);

    // Process clusters in parallel with error isolation
    const results = await Promise.allSettled(
      clusterDetails.map(async clusterDetail => {
        try {
          if ('error' in clusterDetail) {
            logger.error(
              `Failed to get cluster ${clusterDetail.id}: ${clusterDetail.error}, skipping`
            );
            return { clusterId: clusterDetail.id, status: 'skipped' };
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

          logger.info(`Processing cluster ${clusterId} (${thorHost})`);

          // Get monitoring log for this cluster
          const monitoringLog = await MonitoringLog.findOne({
            where: {
              cluster_id: clusterId,
              monitoring_type_id: monitoringType.id,
            },
            raw: true,
          });

          // Determine start and end dates (always from start of current day)
          const { startTime, endTime } = getStartAndEndTime(true);

          logger.info(
            `Fetching workunits for cluster ${clusterId} from ${startTime} to ${endTime}`
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

          // Fetch, transform, and insert workunits
          const result = await getWorkUnits(
            clusterOptions,
            startTime as string,
            endTime as string,
            clusterId,
            timezoneOffset
          );

          if (!result || result.totalFetched === 0) {
            logger.info(`No workunits found for cluster ${clusterId}`);
          } else {
            logger.info(
              `Successfully processed ${result.totalFetched} workunits (${result.totalInserted} inserted/updated) for cluster ${clusterId}`
            );
          }

          // Update monitoring log
          await handleMonitoringLog(
            monitoringLog,
            clusterId,
            monitoringType.id,
            executionStartTime
          );

          return { clusterId, status: 'success', ...result };
        } catch (err: unknown) {
          logger.error(
            `Error processing cluster ${clusterDetail.id}: ${String(err)}`
          );
          return {
            clusterId: clusterDetail.id,
            status: 'error',
            error: String(err),
          };
        }
      })
    );

    // Log summary
    const successful = results.filter(
      r => r.status === 'fulfilled' && r.value.status === 'success'
    ).length;
    const failed = results.filter(
      r => r.status === 'rejected' || r.value?.status === 'error'
    ).length;
    const skipped = results.filter(
      r => r.status === 'fulfilled' && r.value.status === 'skipped'
    ).length;

    logger.info(
      `Cluster processing complete: ${successful} successful, ${failed} failed, ${skipped} skipped`
    );

    const executionTime = new Date().getTime() - executionStartTime.getTime();
    logger.info(
      `WorkUnit History job completed successfully in ${executionTime}ms`
    );
  } catch (err: unknown) {
    logger.error(`WorkUnit History job failed: ${String(err)}`);
    throw err;
  }
}

export {
  getWorkUnits,
  workunitQuery,
  transformWorkunitData,
  fetchWorkunitPage,
};
