import { Workunit } from '@hpcc-js/comms';
import { getCluster } from './getCluster.js';
import { getClusterOptions } from './getClusterOptions.js';

/**
 * Runs a small workunit on the target cluster to retrieve timezone offset in minutes.
 */
export async function getClusterTimezoneOffset(
  clusterId: string
): Promise<number> {
  try {
    const cluster = await getCluster(clusterId);
    const { defaultEngine } = cluster;

    const connectionSettings = getClusterOptions(
      {
        baseUrl: `${cluster.thor_host}:${cluster.thor_port}`,
        userID: cluster.username || '',
        password: cluster.hash || '',
      },
      cluster.allowSelfSigned
    );

    const jobname = `timezone-offset-${process.env.INSTANCE_NAME}`;

    const workunit = await Workunit.create(connectionSettings);
    if (!workunit.Wuid) {
      throw new Error('Failed to create timezone offset workunit');
    }

    const timezoneOffsetEcl =
      'IMPORT Std; now := Std.Date.LocalTimeZoneOffset(); OUTPUT(now);';

    await workunit.update({
      QueryText: timezoneOffsetEcl,
      JobnameOrig: jobname,
    });

    await workunit.submit(defaultEngine);
    await workunit.watchUntilComplete();

    const successState = 3;

    if (workunit.StateID !== successState) {
      throw new Error(
        `Timezone offset job failed with state: ${workunit.StateID}`
      );
    }

    const results = await workunit.fetchResults();
    const rows = results[0] ? await results[0].fetchRows(0, 1, false) : [];

    const row = rows[0] as Record<string, string | number> | undefined;
    const rawOffsetValue = row
      ? (row.Result_1 ?? Object.values(row)[0])
      : undefined;
    const timeZoneOffsetInMinutes = Number(rawOffsetValue) / 60;

    if (Number.isNaN(timeZoneOffsetInMinutes)) {
      throw new Error('Invalid timezone offset result');
    }

    return Math.floor(timeZoneOffsetInMinutes);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const wrappedError = new Error(message) as Error & { cause?: unknown };
    wrappedError.cause = err;
    throw wrappedError;
  }
}
