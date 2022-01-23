const { parentPort, workerData } = require("worker_threads");
const { v4: uuidv4 } = require('uuid');
const hpccUtil = require('../utils/hpcc-util');
const assetUtil = require('../utils/assets');

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
		logToConsole("running spray job: "+ workerData.jobName);
    const sprayJobExecution = await hpccUtil.executeSprayJob({ cluster_id: workerData.clusterId, sprayedFileScope: workerData.sprayedFileScope, sprayFileName: workerData.sprayFileName, sprayDropZone: workerData.sprayDropZone });
    const wuid = sprayJobExecution?.SprayResponse?.Wuid   
    if (!wuid) throw sprayJobExecution;

    workerData.status = 'submitted';
    await assetUtil.recordJobExecution(workerData, wuid);       

	} catch (err) {
    
    logToConsole(err);
    workerData.status = 'error';
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