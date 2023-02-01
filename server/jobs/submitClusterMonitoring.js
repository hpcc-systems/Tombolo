const { parentPort, workerData } = require("worker_threads");

const hpccUtil = require("../utils/hpcc-util");
const models = require("../models");
const ClusterMonitoring = models.ClusterMonitoring;

const { log, dispatch } = require("./workerUtils")(parentPort);

(async () => {
  try {
    console.log('------------------------------------------');
    console.log("SUBMIT CLUSTER MONITORING NOW")
    console.log('------------------------------------------');
  } catch (err) {
    log("error", "Error in File Monitoring Poller", error);
  } finally {
    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
  }
})();
