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
    let jobExecutionRecorded = await assetUtil.recordJobExecution(workerData, '');

	} catch (err) {
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