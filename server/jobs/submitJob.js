const { parentPort, workerData } = require("worker_threads");
const { v4: uuidv4 } = require('uuid');
const hpccUtil = require('../utils/hpcc-util');
const assetUtil = require('../utils/assets.js');
var models  = require('../models');
let Dataflow = models.dataflow;
const workFlowUtil = require('../utils/workflow-util');

let isCancelled = false;
if (parentPort) {
  parentPort.once('message', (message) => {
    if (message === 'cancel') isCancelled = true;
  });
}

const logToConsole = (message) => parentPort.postMessage({action:"logging", data: message});
const dispatchAction = (action,data) =>  parentPort.postMessage({ action, data });   

(async () => {
  if(!workerData.jobExecutionGroupId){
    workerData.jobExecutionGroupId = uuidv4();
  }

  try {
    const wuDetails = await hpccUtil.getJobWuDetails(workerData.clusterId, workerData.jobName, workerData.dataflowId);
    let wuid = wuDetails.wuid;

    logToConsole(`${workerData.jobName} (WU: ${wuid}) to url ${workerData.clusterId}/WsWorkunits/WUResubmit.json?ver_=1.78`)
 
    let wuResubmitResult = await hpccUtil.resubmitWU(workerData.clusterId, wuid, wuDetails.cluster, workerData.dataflowId);
    wuid = wuResubmitResult?.WURunResponse.Wuid;
    if (!wuid) throw wuResubmitResult;
    workerData.status = 'submitted';
    await assetUtil.recordJobExecution(workerData, wuid);        
    
  } catch (err) {
    logToConsole(err);
    const errorMessage = err?.WURunResponse?.Exceptions?.Exception[0]?.Message  || err;
    workerData.status = 'error';
    await assetUtil.recordJobExecution(workerData, '');  
    if(workerData.dataflowId){
      try{
       const dataflow = await Dataflow.findOne({where : {id: workerData.dataflowId}})
       if(dataflow?.dataValues?.metaData?.notification?.failure_message){ //If failure notification is set in Workflow level
          const message = `<p>${dataflow?.dataValues?.metaData?.notification?.failure_message} </p><p>Hello,</p> <p> Below error occurred while submitting <b> ${workerData.jobName} </b></p> <p><span style="color: red">${errorMessage } </span></p>`
          await workFlowUtil.notifyWorkflowExecutionStatus({message , recipients: dataflow?.dataValues?.metaData?.notification?.recipients, subject : 'Workflow failed'})
       }else{ // Failure notification not set in Workflow level - notify user if notification is set in Job level
          await workFlowUtil.notifyJobExecutionStatus({ jobId: jobExecution.jobId, clusterId: jobExecution.clusterId, wuid: jobExecution.wuid, WUstate });
       }
      }catch(err){
        console.log(err)
      }
    }else{
      //Job is not a part of Workflow notify accordingly
         await workFlowUtil.notifyJobExecutionStatus({ jobId: workerData.jobId, clusterId: workerData.clusterId,  WUstate : 'not submitted' });
    }
       
  }  finally{
    if (!workerData.isCronJob)  dispatchAction("remove");   // REMOVE JOB FROM BREE IF ITS NOT CRON JOB!

    if (parentPort) {          
      parentPort.postMessage('done');     
    } else {
      process.exit(0);
    }  
  }
})();