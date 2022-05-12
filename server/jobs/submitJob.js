const { parentPort, workerData } = require("worker_threads");
const { v4: uuidv4 } = require('uuid');
const hpccUtil = require('../utils/hpcc-util');
const assetUtil = require('../utils/assets.js');
var models  = require('../models');
let Dataflow = models.dataflow;
const workFlowUtil = require('../utils/workflow-util');
const { log, dispatch } = require('./workerUtils')(parentPort);

let isCancelled = false;
if (parentPort) {
  parentPort.once('message', (message) => {
    if (message === 'cancel') isCancelled = true;
  });
}

(async () => {
  if(!workerData.jobExecutionGroupId){
    workerData.jobExecutionGroupId = uuidv4();
  }

  try {
    const wuDetails = await hpccUtil.getJobWuDetails(workerData.clusterId, workerData.jobName, workerData.dataflowId);
    let wuid = wuDetails.wuid;

    log('info',`${workerData.jobName} (WU: ${wuid}) to url ${workerData.clusterId}/WsWorkunits/WUResubmit.json?ver_=1.78`)
 
    let wuResubmitResult = await hpccUtil.resubmitWU(workerData.clusterId, wuid, wuDetails.cluster, workerData.dataflowId);
    wuid = wuResubmitResult?.WURunResponse.Wuid;
    if (!wuid) throw wuResubmitResult;
    workerData.status = 'submitted';
    await assetUtil.recordJobExecution(workerData, wuid);        
    
  } catch (err) {
    log("error",`Error in job submit ${workerData.jobName}`, err);
    const errorMessage = err?.WURunResponse?.Exceptions?.Exception[0]?.Message  || err;
    workerData.status = 'error';
    await assetUtil.recordJobExecution(workerData, '');  
    if(workerData.dataflowId){
      try{ // Job that failed to submit is part of workflow
       const dataflow = await Dataflow.findOne({where : {id: workerData.dataflowId}})
       if(dataflow?.dataValues?.metaData?.notification?.failure_message){ //If failure notification is set in Workflow level
        const{dataValues, dataValues : {metaData : {notification : {failure_message, recipients}}}} = dataflow;
        log('info','Error occurred while submitting a job THAT IS PART OF WORKFLOW - notification set at workflow level -> Notifying now' );

           await  workFlowUtil.notifyWorkflowExecutionStatus({
                executionStatus : 'error',
                dataflowName: dataValues.title,
                dataflowId : dataValues.id,
                appId : dataflow.application_id,
                failure_message,
                recipients,
                errorMessage,
                jobName : workerData.jobName
              })


       }else{ // Failure notification not set in Workflow level - notify user if notification is set in Job level
          log('info','Error occurred while submitting a job THAT IS PART OF WORKFLOW - No notification set at workflow level - notify if set at job level');
          await workFlowUtil.notifyJobExecutionStatus({ jobId: workerData.jobId, clusterId: workerData.clusterId,  WUstate : 'not submitted', message : errorMessage });
       }
      }catch(err){
        log("error",`Error in job submit ${workerData.jobName}`, err);
      }
    }else{//Job that failed to submit is NOT a part of Workflow notify accordingly
          log('info','Error occurred while submitting an INDEPENDENT (not part of workflow) - Notify if notification is set at job level');
         await workFlowUtil.notifyJobExecutionStatus({ jobId: workerData.jobId, clusterId: workerData.clusterId,  WUstate : 'not submitted', message : errorMessage });
    }
       
  }  finally{
    if (!workerData.isCronJob)  dispatch("remove");   // REMOVE JOB FROM BREE IF ITS NOT CRON JOB!
    if (parentPort) {          
      parentPort.postMessage('done');     
    } else {
      process.exit(0);
    }  
  }
})();