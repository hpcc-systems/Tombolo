const { parentPort, workerData } = require("worker_threads");
const hpccUtil = require('../utils/hpcc-util');
const assetUtil = require('../utils/assets.js');
const workflowUtil = require('../utils/workflow-util.js');
const JobScheduler = require('../job-scheduler');
const NotificationModule = require('../routes/notifications/email-notification');

let isCancelled = false;
if (parentPort) {
  parentPort.once('message', (message) => {
    if (message === 'cancel') isCancelled = true;
  });
}

const logToConsole = (message) => parentPort.postMessage({action:"logging", data: message});
const dispatchAction = (action,data) =>  parentPort.postMessage({ action, data });   

(async () => {
  let wuid='', wuDetails;
  try {
     if(workerData.jobType == 'Spray') {
      let sprayJobExecution = await hpccUtil.executeSprayJob({
        cluster_id: workerData.clusterId, 
        sprayedFileScope: workerData.sprayedFileScope,
        sprayFileName: workerData.sprayFileName,
        sprayDropZone: workerData.sprayDropZone
      });
      wuid = sprayJobExecution.SprayResponse && sprayJobExecution.SprayResponse.Wuid ? sprayJobExecution.SprayResponse.Wuid : ''      
    } else {
      wuDetails = await hpccUtil.getJobWuDetails(workerData.clusterId, workerData.jobName);
      wuid = wuDetails.wuid;
    }
    
    logToConsole(`${workerData.jobName} (WU: ${wuid}) to url ${workerData.clusterId}/WsWorkunits/WUResubmit.json?ver_=1.78`)
 
    let wuResubmitResult = await hpccUtil.resubmitWU(workerData.clusterId, wuid, wuDetails.cluster);    
    workerData.status = 'submitted';
    //record workflow execution
    let jobExecutionRecorded = await assetUtil.recordJobExecution(workerData, wuResubmitResult?.WURunResponse.Wuid);          
    
  } catch (err) {
		logToConsole(err);
  }  finally{
    if (!workerData.isCronJob)  dispatchAction("remove");   // REMOVE JOB FROM BREE IF ITS NOT CRON JOB!

    if (parentPort) {          
      logToConsole(`signaling done for ${workerData.jobName}`)
      parentPort.postMessage('done');     
    } else {
      process.exit(0);
    }  
  }
})();