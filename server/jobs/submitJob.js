const { parentPort, workerData } = require("worker_threads");
const hpccUtil = require('../utils/hpcc-util');
const assetUtil = require('../utils/assets.js');

let isCancelled = false;
if (parentPort) {
  parentPort.once('message', (message) => {
    if (message === 'cancel') isCancelled = true;
  });
}

const logToConsole = (message) => parentPort.postMessage({action:"logging", data: message});
const dispatchAction = (action,data) =>  parentPort.postMessage({ action, data });   

(async () => {

  try {
    const wuDetails = await hpccUtil.getJobWuDetails(workerData.clusterId, workerData.jobName);
    let wuid = wuDetails.wuid;

    
    logToConsole(`${workerData.jobName} (WU: ${wuid}) to url ${workerData.clusterId}/WsWorkunits/WUResubmit.json?ver_=1.78`)
 
    let wuResubmitResult = await hpccUtil.resubmitWU(workerData.clusterId, wuid, wuDetails.cluster);
    wuid = wuResubmitResult?.WURunResponse.Wuid;
    if (!wuid) throw wuResubmitResult;
    workerData.status = 'submitted';
    //record workflow execution
    await assetUtil.recordJobExecution(workerData, wuid);          
    
  } catch (err) {
    logToConsole(err);
    workerData.status = 'error';
    await assetUtil.recordJobExecution(workerData, '');  

  }  finally{
    if (!workerData.isCronJob)  dispatchAction("remove");   // REMOVE JOB FROM BREE IF ITS NOT CRON JOB!

    if (parentPort) {          
      parentPort.postMessage('done');     
    } else {
      process.exit(0);
    }  
  }
})();