const hpccJSComms = require('@hpcc-js/comms');
const { parentPort } = require('worker_threads');

const { Cluster } = require('../../models');
// const logger = require('../../config/logger');
const hpccUtil = require('../../utils/hpcc-util');
const { getClusterOptions } = require('../../utils/getClusterOptions');

(async () => {
  const startTime = Date.now();

  // Log job start
  if (parentPort) {
    parentPort.postMessage({
      level: 'info',
      text: 'Cluster usage tracker job started...',
    });
  }

  try {
    const allClusters = await Cluster.findAll({
      attributes: ['id', 'storageUsageHistory'],
      raw: true,
    });

    const allClusterDetails = [];
    for (const cl of allClusters) {
      try {
        let cluster = await hpccUtil.getCluster(cl.id);
        const { name, thor_host, thor_port, username, hash, allowSelfSigned } =
          cluster;
        const clusterDetails = {
          baseUrl: `${thor_host}:${thor_port}`,
          userID: username || '',
          password: hash || '',
          id: cl.id,
          name,
          allowSelfSigned,
        };
        allClusterDetails.push(clusterDetails);
      } catch (err) {
        if (parentPort) {
          parentPort.postMessage({
            level: 'error',
            text: `Error getting cluster details for cluster ID ${cl.id}: ${err.message}`,
          });
        }
      }
    }

    for (const detail of allClusterDetails) {
      const currentTimeStamp = Date.now();
      const { storageUsageHistory, id } = detail;
      try {
        // Try catch on each iteration because the loop needs to complete even if some  request fails
        // Get cluster detail with allowSelfSigned removed to ensure no side effect of passing the prop into MachineService
        const { allowSelfSigned, ...detailWOAllowSelfSigned } = detail;
        const machineService = new hpccJSComms.MachineService(
          getClusterOptions(detailWOAllowSelfSigned, allowSelfSigned)
        );
        const targetClusterUsage =
          await machineService.GetTargetClusterUsageEx();

        // 1. No storageUsageHistory
        if (!storageUsageHistory) {
          const usageHistory = {};
          targetClusterUsage.forEach(target => {
            usageHistory[target.Name] = [
              {
                date: currentTimeStamp,
                maxUsage: target.max,
                meanUsage: target.mean,
              },
            ];
          });
          await Cluster.update(
            { storageUsageHistory: usageHistory },
            { where: { id } }
          );
        } else {
          // Some history already in DB
          const machines = Object.keys(storageUsageHistory);
          targetClusterUsage.forEach(target => {
            const newData = {
              date: currentTimeStamp,
              maxUsage: target.max.toFixed(2),
              meanUsage: target.mean.toFixed(2),
            };

            if (machines.includes(target.Name)) {
              storageUsageHistory[target.Name].unshift(newData);
              // Keep only the latest 360 records
              storageUsageHistory[target.Name] = storageUsageHistory[
                target.Name
              ].slice(0, 360);
            } else {
              storageUsageHistory[target.Name] = [newData];
            }
          });
          await Cluster.update({ storageUsageHistory }, { where: { id } });
        }
      } catch (err) {
        if (parentPort) {
          parentPort.postMessage({
            level: 'error',
            text: `Unable to get cluster storage usage for ${detail.name} cluster: ${err.message}`,
          });
        }
      }
    }
  } catch (err) {
    if (parentPort) {
      parentPort.postMessage({
        level: 'error',
        text: `Error in Cluster Monitoring Poller: ${err.message}`,
      });
    }
  } finally {
    const endTime = Date.now();
    const durationSec = ((endTime - startTime) / 1000).toFixed(2);
    if (parentPort) {
      parentPort.postMessage({
        level: 'info',
        text: `Cluster usage tracker job completed in ${durationSec} seconds.`,
      });
      parentPort.postMessage('done');
    } else {
      process.exit(0);
    }
  }
})();
