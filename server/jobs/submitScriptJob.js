const { parentPort, workerData } = require("worker_threads");
const assetUtil = require('../utils/assets');
const models = require('../models');
let Job = models.job;

let isCancelled = false;
if (parentPort) {
  parentPort.once('message', (message) => {
    if (message === 'cancel') isCancelled = true;
  });
}

(async () => {
	try {
		console.log("running script job: "+workerData.jobId);
		let executionResult = await assetUtil.executeScriptJob(workerData.jobId);
		console.log(executionResult);
    //record workflow execution
		//since it is a script job, there is no easy way to identify the completion status, hence marking as completed after invoking the script job
		//in future if script jobs can return back a proper status, this can be changed
		workerData.status = 'completed';
    let jobExecutionRecorded = await assetUtil.recordJobExecution(workerData, '');

	} catch (err) {
			console.log(err);
			workerData.status = 'failed';
			let jobExecutionRecorded = await assetUtil.recordJobExecution(workerData, '');	
	} finally {
		if (parentPort) {
			console.log(`signaling done for ${workerData.jobName}`)
			parentPort.postMessage('done');
		} else {
			process.exit(0);
		}
	}
})();      