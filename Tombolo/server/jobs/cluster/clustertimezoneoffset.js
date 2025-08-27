const { parentPort } = require('worker_threads');

const hpccUtil = require('../../utils/hpcc-util');
const { Cluster } = require('../../models');

const { log } = require('../workerUtils')(parentPort);

async function getClusterTimezoneOffset() {
  const startTime = new Date();
  parentPort &&
    parentPort.postMessage({
      level: 'info',
      text: 'Starting Cluster Timezone Offset Job',
    });

  //grab all clusters
  const clusters = await Cluster.findAll();

  //If no clusters, log so to the console and return
  if (!clusters || clusters.length === 0) {
    log('verbose', 'No clusters to get timezone offset for');
    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: 'No clusters to get timezone offset for',
      });
    return;
  }

  parentPort &&
    parentPort.postMessage({
      level: 'info',
      text: `Getting timezone offset for ${clusters.length} cluster(s)`,
    });

  //loop through clusters
  for (const c of clusters) {
    try {
      //get offset for cluster
      const offset = await hpccUtil.getClusterTimezoneOffset(c.id);

      //get cluster
      let newCluster = await Cluster.findOne({
        where: { id: c.id },
        raw: true,
      });

      //compare if clusters timezone is the same as the retrieved
      if (newCluster.timezone_offset === offset) {
        parentPort &&
          parentPort.postMessage({
            level: 'info',
            text: 'Cluster timezone offset is up to date',
          });
      } else {
        newCluster.timezone_offset = offset;

        // flipping isActive
        await Cluster.update(
          { timezone_offset: offset },
          { where: { id: c.id } }
        );

        parentPort &&
          parentPort.postMessage({
            level: 'info',
            text: `Cluster timezone offset updated for ${c.id}`,
          });
      }
    } catch (err) {
      parentPort &&
        parentPort.postMessage({
          level: 'error',
          text: `Error checking cluster timezone offset: ${err}, cid:  ${c.id}`,
        });
    }
  }

  //once function is done, exit and report finished
  parentPort &&
    parentPort.postMessage({
      level: 'info',
      text: `Cluster Timezone Offset Job completed in ${(new Date() - startTime) / 1000} seconds`,
    });
  if (parentPort) parentPort.postMessage('done');
  else process.exit(0);
}

(async () => {
  await getClusterTimezoneOffset();
})();

module.exports = getClusterTimezoneOffset;
