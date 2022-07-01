const { parentPort, workerData } = require("worker_threads");
const { v4: uuidv4 } = require('uuid');
const hpccUtil = require('../utils/hpcc-util');
const assetUtil = require('../utils/assets');
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
		log('info',"running spray job: "+ workerData.jobName);
    const sprayJobExecution = await hpccUtil.executeSprayJob({ cluster_id: workerData.clusterId, sprayedFileScope: workerData.sprayedFileScope, sprayFileName: workerData.sprayFileName, sprayDropZone: workerData.sprayDropZone });
    const wuid = sprayJobExecution?.SprayResponse?.Wuid   
    if (!wuid) throw sprayJobExecution;

    workerData.status = 'submitted';
    await assetUtil.recordJobExecution(workerData, wuid);       

	} catch (err) {
		log("error",`Error in submitSprayJob ${workerData.jobName}`, err);

    workerData.status = 'error';
    await assetUtil.recordJobExecution(workerData, '');     
	} finally{
		if (!workerData.isCronJob) dispatch("remove");   // REMOVE JOB FROM BREE IF ITS NOT CRON JOB!
	
		if (parentPort) {          
			parentPort.postMessage('done');     
		} else {
			process.exit(0);
		}  
	}
})();      