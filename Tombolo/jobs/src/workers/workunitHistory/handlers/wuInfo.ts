import type {
  WorkUnitExceptionAttributes,
  WorkUnitInstance,
  Transaction
} from '@tombolo/db';
import db from '@tombolo/db';
import { TERMINAL_STATES } from '@tombolo/shared';
import logger from '../../../config/logger.js';
import { Workunit } from '@hpcc-js/comms';
import { getClusterOptions, getClusters } from '@tombolo/core';
import { ifEmptyNull } from '@tombolo/shared';

const { WorkUnit, WorkUnitException } = db;

/*
 Fetches workunits for a cluster that are terminal
 */
async function fetchWorkunits(clusterId: string): Promise<WorkUnitInstance[]> {

  return WorkUnit.findAll({
    where: {
      clusterId,
      state: TERMINAL_STATES,
      exceptionsFetchedAt: null,
      clusterDeleted: false,
    },
    limit: 20,
  });
}

/*
 Handles all per-cluster DB writes in a single transaction
 */
async function saveClusterDbUpdates(
  clusterId: string,
  exceptionsToCreate: WorkUnitExceptionAttributes[],
  deletedWuIds: string[],
  successfulWuIds: string[]
) {
  await db.sequelize.transaction(async (t: Transaction) => {
    if (exceptionsToCreate.length > 0) {
      await WorkUnitException.bulkCreate(exceptionsToCreate, {
        ignoreDuplicates: true,
        validate: true,
        transaction: t,
      });
    }

    if (deletedWuIds.length > 0) {
      const ids = Array.from(new Set(deletedWuIds));
      await WorkUnit.update(
        { clusterDeleted: true },
        { where: { clusterId, wuId: ids }, transaction: t }
      );
    }

    if (successfulWuIds.length > 0) {
      const ids = Array.from(new Set(successfulWuIds));
      await WorkUnit.update(
        { exceptionsFetchedAt: new Date() },
        { where: { clusterId, wuId: ids }, transaction: t }
      );
    }
  });
}

/*
 Main method for the WuInfo job
 */
async function getWorkunitInfo() {
  let clusterDetails = [];
  try {
    clusterDetails = await getClusters(null);
  } catch (err) {
    logger.error(`Error getting clusters: ${String(err)}`);
    return;
  }

  for (const clusterDetail of clusterDetails) {
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

    const clusterOptions = getClusterOptions(
      {
        baseUrl: `${thorHost}:${thorPort}`,
        userID: username || '',
        password: hash || '',
        timeoutSecs: 180,
      },
      allowSelfSigned
    );

    // Cluster-level baseline memory snapshot
    const clusterMemStart = process.memoryUsage();
    logger.info(
      `WUInfo: Processing cluster: ${clusterDetail.name} (mem rssMB=${Math.round(
        clusterMemStart.rss / 1024 / 1024
      )}, heapUsedMB=${Math.round(clusterMemStart.heapUsed / 1024 / 1024)})`
    );
    const wus = await fetchWorkunits(clusterId);

    // Per-cluster accumulators
    const exceptionsToCreate: WorkUnitExceptionAttributes[] = [];
    const successfulWuIds: string[] = [];
    const deletedWuIds: string[] = [];

    for (const wu of wus) {
      try {
        const attachedWu = Workunit.attach(clusterOptions, wu.wuId);

        // Per-WU diagnostics: time + memory before fetch
        const startedAt = Date.now();
        const memBefore = process.memoryUsage();
        logger.debug?.(
          `WUInfo: fetching wuId=${wu.wuId} (rssMB=${Math.round(
            memBefore.rss / 1024 / 1024
          )}, heapUsedMB=${Math.round(memBefore.heapUsed / 1024 / 1024)})`
        );

        const wuInfo = await attachedWu.fetchInfo({
          IncludeExceptions: true,
          IncludeGraphs: false,
          IncludeSourceFiles: false,
          IncludeResults: false,
          IncludeResultsViewNames: false,
          IncludeVariables: false,
          IncludeTimers: false,
          IncludeDebugValues: false,
          IncludeApplicationValues: false,
          IncludeWorkflows: false,
          IncludeXmlSchemas: false,
          IncludeResourceURLs: false,
          IncludeECL: false,
          IncludeHelpers: false,
          IncludeAllowedClusters: false,
          IncludeTotalClusterTime: false,
          IncludeServiceNames: false,
          IncludeProcesses: false
        });

        const memAfter = process.memoryUsage();
        const durMs = Date.now() - startedAt;
        const exceptionCount = wuInfo?.Workunit?.Exceptions?.ECLException?.length ?? 0;
        logger.info(
          `WUInfo: fetched wuId=${wu.wuId} in ${durMs}ms, exceptions=${exceptionCount} (heapUsedΔMB=${((
            memAfter.heapUsed - memBefore.heapUsed
          ) /
            1024 /
            1024).toFixed(2)}, rssΔMB=${((memAfter.rss - memBefore.rss) / 1024 / 1024).toFixed(2)})`
        );

        // Consider this WU successfully fetched even if there are no exceptions
        successfulWuIds.push(wu.wuId);

        const exceptions = wuInfo?.Workunit?.Exceptions?.ECLException ?? [];
        for (const exception of exceptions) {
          if (exception.Severity.toLowerCase() === 'info') continue;

          exceptionsToCreate.push({
            wuId: wu.wuId,
            clusterId: clusterId,
            severity: exception.Severity,
            source: ifEmptyNull(exception.Source),
            code: exception.Code,
            message: ifEmptyNull(exception.Message),
            column: exception.Column || null,
            lineNo: exception.LineNo || null,
            fileName: ifEmptyNull(exception.FileName),
            activity: exception.Activity || null,
            scope: exception.Scope || null,
            priority: exception.Priority || null,
            cost: exception.Cost || null,
            clusterDeleted: false,
            createdAt: new Date(),
          });
        }
      } catch (err) {
        // Check if the error is due to the workunit being deleted from the cluster
        if (
          err instanceof Error &&
          err.message &&
          err.message.toLowerCase().includes('cannot open workunit')
        ) {
          logger.warn(
            `Workunit ${wu.wuId} has been deleted from cluster, will mark as clusterDeleted in batch`
          );

          deletedWuIds.push(wu.wuId);
        } else {
          const memNow = process.memoryUsage();
          logger.error(
            `Error processing workunit ${wu.wuId}: ${String(err)} (rssMB=${Math.round(
              memNow.rss / 1024 / 1024
            )}, heapUsedMB=${Math.round(memNow.heapUsed / 1024 / 1024)})`,
            err instanceof Error ? { stack: err.stack } : {}
          );
        }
      }

      // Sleep to avoid hitting the cluster too quickly
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Bulk DB operations per cluster
    try {
      await saveClusterDbUpdates(
        clusterId,
        exceptionsToCreate,
        deletedWuIds,
        successfulWuIds
      );
    } catch (err) {
      logger.error(
        `WUInfo: DB batch operations failed for cluster ${clusterDetail.name}: ${String(err)}`,
        err instanceof Error ? { stack: err.stack } : {}
      );
    }

    // Cluster-level memory summary
    const clusterMemEnd = process.memoryUsage();
    logger.info(
      `WUInfo: Finished cluster ${clusterDetail.name} — processedWUs=${wus.length}, exceptionsToCreate=${exceptionsToCreate.length}, deletedWuIds=${deletedWuIds.length}, successfulWuIds=${successfulWuIds.length} (heapUsedΔMB=${((
        clusterMemEnd.heapUsed - clusterMemStart.heapUsed
      ) /
        1024 /
        1024).toFixed(2)}, rssΔMB=${((clusterMemEnd.rss - clusterMemStart.rss) / 1024 / 1024).toFixed(
        2
      )})`
    );
  }
}

export { getWorkunitInfo };