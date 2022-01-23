const { parentPort, workerData } = require("worker_threads");
const { v4: uuidv4 } = require('uuid');
const assetUtil = require('../utils/assets');
const models = require('../models');
let Job = models.job;

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
		logToConsole("running script job: "+ workerData.jobId);
		let executionResult = await assetUtil.executeScriptJob(workerData.jobId);
		logToConsole(executionResult);
   		//record workflow execution
		//since it is a script job, there is no easy way to identify the completion status, hence marking as completed after invoking the script job
		//in future if script jobs can return back a proper status, this can be changed
		workerData.status = 'completed';
		await assetUtil.recordJobExecution(workerData, '');

	} catch (err) {
		logToConsole(err);
		workerData.status = 'failed';
		await assetUtil.recordJobExecution(workerData, '');	
	} finally{
		if (!workerData.isCronJob) dispatchAction("remove");   // REMOVE JOB FROM BREE IF ITS NOT CRON JOB!
	
		if (parentPort) {          
			parentPort.postMessage('done');     
		} else {
			process.exit(0);
		}  
	}
})();      