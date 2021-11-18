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
	console.log("Send notification ...")
	try {
		workerData.url = `${process.env.WEB_URL}${workerData.applicationId}/manualJobDetails/${workerData.jobId}`
		const jobExecution = await JobExecution.create(workerData);
		await assetUtil.notifyManualJob(workerData);
	}catch (err) {
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