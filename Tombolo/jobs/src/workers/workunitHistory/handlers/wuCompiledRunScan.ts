import { IOptions, Workunit } from '@hpcc-js/comms';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { getClusters, getClusterOptions } from '@tombolo/core';
import { WorkUnit } from '@tombolo/db';
import { retryWithBackoff } from '@tombolo/shared';
import { msGraphClient } from '@tombolo/shared/backend';
import { notificationsQueue } from '@/queues/notificationsQueue.js';
import logger from '@/config/logger.js';

const COMPILED_STATE = 'compiled';
const COMPILED_RUN_ACTIONS = ['run'];

const GLOBAL_SCOPE_TYPE = 'global';
const WHEN_COMPILED_PROPERTY = 'WhenCompiled';
const COMPILED_THRESHOLD_MINUTES = 60;
const COMPILED_THRESHOLD_MS = COMPILED_THRESHOLD_MINUTES * 60 * 1000;

async function fetchGlobalScopes(clusterOptions: IOptions, wuId: string) {
  return await retryWithBackoff(async () => {
    const attachedWu = Workunit.attach(clusterOptions, wuId);

    return await attachedWu.fetchDetailsRaw({
      ScopeFilter: {
        MaxDepth: 1,
        ScopeTypes: [GLOBAL_SCOPE_TYPE],
      },
      NestedFilter: {
        ScopeTypes: [GLOBAL_SCOPE_TYPE],
      },
      PropertyOptions: {
        IncludeName: true,
        IncludeRawValue: true,
      },
      PropertiesToReturn: {
        AllProperties: true,
      },
    });
  });
}

/**
 * Extracts the WhenCompiled timestamp from HPCC global scope properties
 * and converts it from cluster-local microseconds to UTC milliseconds.
 * Returns null if the property is absent.
 */
function extractWhenCompiledMs(
  globalScopes: Array<Record<string, any>>,
  timezoneOffset: number
): number | null {
  const globalScope = globalScopes.find(
    s => s?.ScopeType === GLOBAL_SCOPE_TYPE
  );
  if (!globalScope) return null;

  const properties: Array<{ Name: string; RawValue: string }> =
    globalScope.Properties?.Property ?? [];
  const prop = properties.find(p => p.Name === WHEN_COMPILED_PROPERTY);
  if (!prop?.RawValue) return null;

  // RawValue is microseconds in cluster local time.
  // Divide by 1000 → milliseconds, then subtract timezone offset → UTC ms.
  const rawMs = Number(prop.RawValue) / 1000;
  return rawMs - timezoneOffset * 60 * 1000;
}

/**
 * Formats a stuck duration in ms as a human-readable string.
 * Under 60 minutes → "X minutes", 60+ minutes → "X hours" (1 decimal).
 */
function formatStuckDuration(stuckMs: number): string {
  const stuckMinutes = Math.floor(stuckMs / 60_000);
  if (stuckMinutes < 60) return `${stuckMinutes} minutes`;
  const stuckHours = (stuckMs / 3_600_000).toFixed(1);
  return `${stuckHours} hours`;
}

// Dev-only override for local testing
// const EMAIL_OVERRIDE = 'john.doe@test.com';

async function enqueueStuckWuNotification(params: {
  wuId: string;
  wuName: string | null;
  owner: string;
  ownerEmail: string;
  supervisorEmail: string | null;
  actionEx: string | null;
  stuckMs: number;
}): Promise<void> {
  const {
    wuId,
    wuName,
    owner,
    ownerEmail,
    supervisorEmail,
    actionEx,
    stuckMs,
  } = params;
  const recipients = {
    mainRecipients: [ownerEmail],
    ...(supervisorEmail ? { cc: [supervisorEmail] } : {}),
    // mainRecipients: [EMAIL_OVERRIDE],
    // cc: [EMAIL_OVERRIDE],
  };
  const stuckDuration = formatStuckDuration(stuckMs);
  const notificationId = uuidv4();
  const idempotencyKey = `compiled-run-scan-${wuId}`;
  const subject = `Workunit ${wuId} stuck in compiled state for ${stuckDuration}`;

  await notificationsQueue.add(
    'send-notification',
    {
      notificationId,
      idempotencyKey,
      channel: 'email',
      deliveryMode: 'immediate',
      templateName: 'compiledRunScan',
      notificationOrigin: 'Compiled Run Scan',
      subject,
      recipients,
      createdBy: 'System',
      metaData: {
        notificationDescription: subject,
        ...recipients,
        wuId,
        wuName: wuName ?? '',
        owner,
        ownerEmail,
        supervisorEmail,
        actionEx: actionEx ?? '',
        stuckDuration,
      },
    },
    { jobId: idempotencyKey }
  );
}

async function wuCompiledRunScan() {
  logger.info('Starting compiled/run workunit scan');

  try {
    const clusterDetails = await getClusters(null);

    if (!clusterDetails || clusterDetails.length === 0) {
      logger.info('No clusters found to process for compiled/run scan');
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
        timezone_offset: timezoneOffset = 0,
      } = clusterDetail;

      const compiledRunWorkunits = await WorkUnit.findAll({
        where: {
          clusterId,
          state: COMPILED_STATE,
          actionEx: { [Op.in]: COMPILED_RUN_ACTIONS },
          clusterDeleted: false,
        },
        order: [['workUnitTimestamp', 'ASC']],
        raw: true,
      });

      logger.info(
        `Compiled/run scan found ${compiledRunWorkunits.length} workunit(s) in compiled state for cluster ${clusterId}`
      );

      if (compiledRunWorkunits.length === 0) {
        continue;
      }

      const clusterOptions = getClusterOptions(
        {
          baseUrl: `${thorHost}:${thorPort}`,
          userID: username || '',
          password: hash || '',
          timeoutSecs: 180,
        },
        allowSelfSigned
      );

      for (const wu of compiledRunWorkunits) {
        try {
          const scopes = await fetchGlobalScopes(clusterOptions, wu.wuId);
          const globalScopes = (scopes || []).filter(
            scope => scope?.ScopeType === GLOBAL_SCOPE_TYPE
          );

          const whenCompiledUtcMs = extractWhenCompiledMs(
            globalScopes,
            timezoneOffset
          );

          if (whenCompiledUtcMs === null) continue;

          const stuckMs = Date.now() - whenCompiledUtcMs;

          if (stuckMs > COMPILED_THRESHOLD_MS) {
            const stuckMinutes = Math.floor(stuckMs / 60_000);
            const { user, manager } = await msGraphClient.getUserWithManager(
              wu.owner
            );
            const ownerEmail = user?.mail?.trim() ?? '';
            const supervisorEmail = manager?.mail?.trim() || null;

            if (!ownerEmail) {
              logger.warn(
                `Skipping compiled-state notification for wuId=${wu.wuId}: owner email not found in MS Graph (owner=${wu.owner})`
              );
              continue;
            }

            logger.warn(
              `Workunit stuck in compiled state: wuId=${wu.wuId}, owner=${wu.owner}, ownerEmail=${ownerEmail}, supervisorEmail=${supervisorEmail}, clusterId=${clusterId}, actionEx=${wu.actionEx}, stuckMinutes=${stuckMinutes}, threshold=${COMPILED_THRESHOLD_MINUTES} minutes`
            );
            await enqueueStuckWuNotification({
              wuId: wu.wuId,
              wuName: wu.jobName ?? null,
              owner: wu.owner,
              ownerEmail,
              supervisorEmail,
              actionEx: wu.actionEx ?? null,
              stuckMs,
            });
          }
        } catch (err) {
          if (String(err).includes('Cannot open workunit')) continue; // Deleted wus - can be ignored, no action needed
          logger.error(
            `WUID ${wu.wuId} : cluster ${clusterId}: ${String(err)}`
          );
        }
      }
    }
  } catch (err) {
    logger.error(`Compiled/run scan failed: ${String(err)}`);
    throw err;
  }
}

export { wuCompiledRunScan };
