// Imports
import { workerData } from 'worker_threads';
import { logOrPostMessage } from '../jobUtils.js';
import { decryptString } from '@tombolo/shared';

// Local Imports
import { Cluster, JobMonitoringData } from '@tombolo/db';
import { WorkunitsService } from '@hpcc-js/comms';
import shallowCopyWithoutNested from '../../utils/shallowCopyWithoutNested.js';
import { WUInfoOptions } from './monitorJobsUtil.js';
import { getClusterOptions } from '../../utils/getClusterOptions.js';
import type { ClusterWithPassword } from '../../types/cluster.js';

// Self Invoking function
(async () => {
  const { job } = workerData;
  const { clusterId, jobName, monitoringId, applicationId } = job.data;
  try {
    const startTime = new Date().getTime();
    logOrPostMessage({
      level: 'info',
      text: 'Fetch Workunit Info - started',
    });

    // Get cluster information
    const clusterInfo = await Cluster.findOne({
      where: { id: clusterId },
      raw: true,
      attributes: [
        'id',
        'name',
        'thor_host',
        'roxie_host',
        'thor_port',
        'roxie_port',
        'username',
        'hash',
        'allowSelfSigned',
      ],
    });

    // If no cluster info is present, return
    if (!clusterInfo) {
      logOrPostMessage({
        level: 'error',
        text: `Fetch Workunit Info - Cluster with id ${clusterId} not found`,
      });
      return;
    }

    // Add decrypted password to a typed cluster object for auth
    const clusterInfoWithPassword: ClusterWithPassword = {
      ...clusterInfo,
      password: clusterInfo.hash
        ? decryptString(clusterInfo.hash, process.env.ENCRYPTION_KEY)
        : null,
    };

    // Create WorkunitService
    const wuService = new WorkunitsService(
      getClusterOptions(
        {
          baseUrl: `${clusterInfoWithPassword.thor_host}:${clusterInfoWithPassword.thor_port}/`,
          userID: clusterInfoWithPassword.username || '',
          password: clusterInfoWithPassword.password || '',
        },
        clusterInfoWithPassword.allowSelfSigned
      )
    );

    // Get Matching work unites
    const {
      Workunits: { ECLWorkunit },
    } = await wuService.WUQuery({
      Jobname: jobName,
      Count: 10,
      State: 'completed',
    });

    // If no workunits found, return
    if (ECLWorkunit.length === 0) {
      logOrPostMessage({
        level: 'info',
        text: `Fetch Workunit Info - No workunits found for job ${jobName}`,
      });
      return;
    }

    // Get workunit info for all workunits
    const workUnits = ECLWorkunit.map(wu => {
      return wu.Wuid;
    });

    // Iterate over workunits and get wuInfo
    const allWuInfo = [];

    for (const wu of workUnits) {
      const wuInfoParams = WUInfoOptions(wu);
      const wuInfo = await wuService.WUInfo({
        ...wuInfoParams,
      });
      allWuInfo.push(wuInfo.Workunit || {});
    }

    // Iterate over allWuInfo and create wuTopLevelInfo array
    const wuTopLevelInfo = allWuInfo.map(wu => {
      return shallowCopyWithoutNested(wu);
    });

    // Create rows for job Monitoring data
    const jmDataRows = wuTopLevelInfo.map(wu => {
      return {
        applicationId,
        wuId: wu.Wuid,
        wuState: wu.State,
        monitoringId,
        date: new Date(startTime),
        wuTopLevelInfo: wu,
        wuDetailInfo: allWuInfo.find(wuInfo => wuInfo.Wuid === wu.Wuid),
        metaData: JSON.stringify({}),
        analyzed: true,
      };
    });

    // Save job Monitoring data
    await JobMonitoringData.bulkCreate(jmDataRows);

    logOrPostMessage({
      level: 'info',
      text: `Fetch Workunit Info completed in ${new Date().getTime() - startTime} ms`,
    });
  } catch (err) {
    logOrPostMessage({
      level: 'error',
      text: `Cluster reachability:  monitoring failed - ${err.message}`,
    });
  }
})();
