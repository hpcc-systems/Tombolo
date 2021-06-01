const { parentPort, workerData } = require("worker_threads");
const request = require('request-promise');
const hpccUtil = require('../utils/hpcc-util');
const assetUtil = require('../utils/assets.js');

let isCancelled = false;
if (parentPort) {
  parentPort.once('message', (message) => {
    if (message === 'cancel') isCancelled = true;
  });
}

(async () => {
  try {
    let wuid='';
    if(workerData.jobType == 'Spray') {
      let sprayJobExecution = await hpccUtil.executeSprayJob({
        cluster_id: workerData.clusterId, 
        sprayedFileScope: workerData.sprayedFileScope,
        sprayFileName: workerData.sprayFileName,
        sprayDropZone: workerData.sprayDropZone
      });
      wuid = sprayJobExecution.SprayResponse && sprayJobExecution.SprayResponse.Wuid ? sprayJobExecution.SprayResponse.Wuid : ''      
    } else {
      wuid = await hpccUtil.getJobWuidByName(workerData.clusterId, workerData.jobName);
    }
    console.log(
    `submitting job ${workerData.jobName} ` +
    `(WU: ${wuid}) to url ${workerData.clusterId}/WsWorkunits/WUResubmit.json?ver_=1.78`
    );
    let wuInfo = await hpccUtil.resubmitWU(workerData.clusterId, wuid);
    //record workflow execution
    let jobExecutionRecorded = await assetUtil.recordJobExecution(workerData, wuid);
  } catch (err) {
    console.log(err);
  } finally {
    if (parentPort) {
      console.log(`signaling done for ${workerData.jobName}`)
      parentPort.postMessage('done');
    } else {
      process.exit(0);
    }
  }
})();