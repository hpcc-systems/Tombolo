const { parentPort, workerData } = require("worker_threads");
const assetUtil = require('../utils/workflow-util');
const models = require('../models');
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
	let jobExecution;
	try {
		workerData.notifiedOn = new Date().getTime();
		jobExecution = await JobExecution.create(workerData);
    workerData.url = `${process.env.WEB_URL}${workerData.applicationId}/manualJobDetails/${workerData.jobId}/${jobExecution.id}`;
		await assetUtil.notifyManualJob(workerData);
	}catch (err) {
		if(jobExecution){
			await jobExecution.update({status : 'error'})
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