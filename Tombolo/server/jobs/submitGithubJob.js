// import {parentPort, workerData} from 'worker_threads';
// import {v4 as uuidv4} from 'uuid';
// const assetUtil = require('../utils/assets.js');
// import {log, dispatch} from './workerUtils.js';(parentPort);

// let isCancelled = false;
// if (parentPort) {
//   parentPort.once('message', (message) => {
//     if (message === 'cancel') isCancelled = true;
//   });
// }

// (async () => {

//   try {
//     const flowSettings ={
//       dataflowVersionId: workerData.dataflowVersionId,
//       gitHubFiles : workerData.metaData.gitHubFiles,
//       applicationId: workerData.applicationId,
//       dataflowId: workerData.dataflowId,
//       clusterId: workerData.clusterId,
//       jobName : workerData.jobName,
//       jobId: workerData.jobId,
//       jobExecutionGroupId : workerData.jobExecutionGroupId || uuidv4()
//     }

//     log('info',`✔️ SUBMITGITHUBJOB.JS: CREATING GITHUB FLOW WITH BREE FOR JOB ${workerData.jobName} id:${workerData.jobId}; dflow: ${workerData.dataflowId};`);
//     const summary = await assetUtil.createGithubFlow(flowSettings);
//     log('info','✔️ SUBMITGITHUBJOB.JS: SUBMITTED JOB FROM BREE, SUMMARY!')
//     log('info',summary)

//   } catch (err) {
//     log('info','submitGitHubJob.js catch an error in worker proccess');

//   } finally{
//     if (!workerData.isCronJob) dispatch("remove");   // REMOVE JOB FROM BREE IF ITS NOT CRON JOB!
//     if (parentPort) {
//       parentPort.postMessage('done');
//     } else {
//       process.exit(0);
//     }
//   }

// })();
