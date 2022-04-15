const { parentPort, workerData } = require("worker_threads");
const workFlowUtil = require('../utils/workflow-util');
const assetUtil = require('../utils/assets.js');
const models = require('../models');
const { v4: uuidv4 } = require('uuid');
const JobExecution = models.job_execution;


let isCancelled = false;
if (parentPort) {
  parentPort.once('message', (message) => {
    if (message === 'cancel') isCancelled = true;
  });
}

const logToConsole = (message) => parentPort.postMessage({action:"logging", data: message});
const dispatchAction = (action,data) =>  parentPort.postMessage({ action, data });   

(async () => {
	logToConsole("Send notification ...");
	if(!workerData.jobExecutionGroupId){
		workerData.jobExecutionGroupId = uuidv4();
	}
		
	let execution;
	try {
		workerData.manualJob_meta.notifiedOn = new Date().getTime();
		workerData.status= 'wait';
		execution = await assetUtil.recordJobExecution(workerData);
    	workerData.url = `${process.env.WEB_URL}/${workerData.applicationId}/manualJobDetails/${workerData.jobId}/${execution}`;
		await workFlowUtil.notifyManualJob(workerData);
	}catch (err) {
		if(execution){
			await JobExecution.update({status : 'error'}, {where : {id : execution}})
		}
		logToConsole(err)
	} finally{
	if (!workerData.isCronJob) dispatchAction("remove");   // REMOVE JOB FROM BREE IF ITS NOT CRON JOB!

	if (parentPort) {          
		parentPort.postMessage('done');     
	} else {
		process.exit(0);
	}  
	}
})();      