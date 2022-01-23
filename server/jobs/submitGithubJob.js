const { parentPort, workerData } = require("worker_threads");
const { v4: uuidv4 } = require('uuid');
const assetUtil = require('../utils/assets.js');

let isCancelled = false;
if (parentPort) {
  parentPort.once('message', (message) => {
    if (message === 'cancel') isCancelled = true;
  });
}

const logToConsole = (message) => parentPort.postMessage({action:"logging", data: message});
const dispatchAction = (action,data) =>  parentPort.postMessage({ action, data });   

(async () => { 

  try {
    const flowSettings ={
      gitHubFiles : workerData.metaData.gitHubFiles,
      applicationId: workerData.applicationId,
      dataflowId: workerData.dataflowId,
      clusterId: workerData.clusterId,
      jobName : workerData.jobName,
      jobId: workerData.jobId,
      jobExecutionGroupId : workerData.jobExecutionGroupId || uuidv4()
    }

    logToConsole(`✔️ SUBMITGITHUBJOB.JS: CREATING GITHUB FLOW WITH BREE FOR JOB ${workerData.jobName} id:${workerData.jobId}; dflow: ${workerData.dataflowId};`);     
    const summary = await assetUtil.createGithubFlow(flowSettings);
    logToConsole('✔️ SUBMITGITHUBJOB.JS: SUBMITTED JOB FROM BREE, SUMMARY!')
    logToConsole(summary)

  } catch (err) {
    logToConsole('submitGitHubJob.js catch an error in worker proccess');

  } finally{
    if (!workerData.isCronJob) dispatchAction("remove");   // REMOVE JOB FROM BREE IF ITS NOT CRON JOB!

    if (parentPort) {          
      parentPort.postMessage('done');     
    } else {
      process.exit(0);
    }  
  }

})();