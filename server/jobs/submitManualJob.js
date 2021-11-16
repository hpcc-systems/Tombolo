// const { parentPort, workerData } = require("worker_threads");
// const assetUtil = require('../utils/workflow-util');
// const models = require('../models');
// const JobExecution = models.job_execution;

// (async () => {
// 	console.log("<<<<<<< Send notification from here")
//     JobExecution.create(workerData)
// 	workerData.url = `${process.env.WEB_URI}${workerData.applicationId}/manualJobDetails/${workerData.jobId}`
// 	workerData.for = 'manualJobNotification'
//     assetUtil.notifyManualJob(workerData);
// })();      


const { parentPort, workerData } = require("worker_threads");


let isCancelled = false;
if (parentPort) {
  parentPort.once('message', (message) => {
    if (message === 'cancel') isCancelled = true;
  });
}

(async () => {
  let wuResult, wuid='';
  try {
	console.log("<<<<<<< Send notification from here")
    // JobExecution.create(workerData)
	// workerData.url = `${process.env.WEB_URI}${workerData.applicationId}/manualJobDetails/${workerData.jobId}`
	// workerData.for = 'manualJobNotification'
    // assetUtil.notifyManualJob(workerData);

    
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