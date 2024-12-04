const { parentPort} = require("worker_threads");

const hpccUtil = require("../../utils/hpcc-util");
const models = require("../../models");
const logger = require("../../config/logger");
const cluster = models.cluster;

const { log, dispatch } = require("../workerUtils")(parentPort);

(async () => {
  parentPort && parentPort.postMessage({level: "info", message: "Starting Cluster Timezone Offset Job"});
  //grab all clusters
  const clusters = await cluster.findAll();

  //If no clusters, log so to the console and return
  if (clusters.length === 0) {
    log("verbose", `NO CLUSTERS TO FIND OFFSET FOR FOUND`);
    return;
  }

  //if clusters are found, iterate through them and set timezone offset for each one
  await setClusterTimezoneOffset(clusters);

  //once function is done, exit and report finished
  if (parentPort) parentPort.postMessage("done");
  else process.exit(0);
})();

async function setClusterTimezoneOffset(clusters) {
  //loop through clusters
  for (i = 0; i < clusters.length; i++) {
    try {
      //get offset for cluster
      const offset = await hpccUtil.getClusterTimezoneOffset(
        clusters[i].dataValues.id
      );

      //get cluster
      let newCluster = await cluster.findOne({
        where: { id: clusters[i].dataValues.id },
      });

      //compare if clusters timezone is the same as the retrieved
      if (newCluster.dataValues.timezone_offset === offset) {
        log("verbose", `CLUSTER TIMEZONE OFFSET NOT NEEDED TO BE UPDATED`);
      } else {
        newCluster.timezone_offset = offset;

        // flipping isActive
        await cluster.update(
          { timezone_offset: offset },
          { where: { id: clusters[i].dataValues.id } }
        );
        log(
          "verbose",
          `CLUSTER TIMEZONE  OFFSET UPDATED FOR CLUSTERID: ` +
            clusters[i].dataValues.id
        );
      }
    } catch (err) {
      log("error", "ERROR CHECKING CLUSTER TIMEZONE OFFSETS: " + err);
    }
  }
}
