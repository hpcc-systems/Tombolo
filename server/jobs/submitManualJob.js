const { parentPort, workerData } = require("worker_threads");
const assetUtil = require('../utils/workflow-util');
const models = require('../models')
const JobExecution = models.job_execution;

let isCancelled = false;
if (parentPort) {
  parentPort.once('message', (message) => {
    if (message === 'cancel') isCancelled = true;
  });
}

(async () => {
	try{
	console.log("Send notification ...")
	workerData.url = `${process.env.WEB_URI}${workerData.applicationId}/manualJobDetails/${workerData.jobId}`
    JobExecution.create(workerData).then(response => { assetUtil.notifyManualJob(workerData)});
	}catch(err){
		console.log(err)
	}finally {
		if (parentPort) {
			console.log(`signaling done for ${workerData.jobName}`)
			parentPort.postMessage('done');
		} else {
			process.exit(0);
		}
	}
})();      