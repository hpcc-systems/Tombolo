const hpccJSComms = require("@hpcc-js/comms");
const { parentPort } = require("worker_threads");

const models = require("../../models");
const Cluster = models.cluster;
const logger = require("../../config/logger");
const hpccUtil = require("../../utils/hpcc-util");

(async () => {
  try {
    const allClusters = await Cluster.findAll({
      attributes: ["id", "storageUsageHistory"],
      raw: true,
    });

    const allClusterDetails = [];
    for (const cl of allClusters) {
      try {
        let cluster = await hpccUtil.getCluster(cl.id); // Checks if cluster is reachable and decrypts cluster credentials if any
        const { name, thor_host, thor_port, username, hash } = cluster;
        const clusterDetails = {
          baseUrl: `${thor_host}:${thor_port}`,
          userID: username || "",
          password: hash || "",
          id: cl.id,
          name,
        };
        allClusterDetails.push(clusterDetails);
      } catch (err) {
        logger.error(err);
      }
    }

    for (const detail of allClusterDetails) {
      const currentTimeStamp = Date.now();
      const { storageUsageHistory, id } = detail;
      try {
        // Try catch on each iteration coz the loop needs to complete even if some  request fails
        const machineService = new hpccJSComms.MachineService(detail);
        const targetClusterUsage =
          await machineService.GetTargetClusterUsageEx();

        // 1. No storageUsageHistory
        if (!storageUsageHistory) {
          const usageHistory = {};
          targetClusterUsage.forEach((target) => {
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
          targetClusterUsage.forEach((target) => {
            const newData = {
              date: currentTimeStamp,
              maxUsage: target.max.toFixed(2),
              meanUsage: target.mean.toFixed(2),
            };

            if (machines.includes(target.Name)) {
              storageUsageHistory[target.Name].unshift(newData);
            } else {
              storageUsageHistory[target.Name] = [newData];
            }
          });
          await Cluster.update({ storageUsageHistory }, { where: { id } });
        }
      } catch (err) {
        logger.error(
          new Error(
            `Unable to get cluster storage usage for ${detail.name} cluster.`
          )
        );
      }
    }
  } catch (err) {
    logger.error("Error in Cluster Monitoring Poller", err);
  } finally {
    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
  }
})();
