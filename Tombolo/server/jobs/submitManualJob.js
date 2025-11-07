// const { parentPort, workerData } = require('worker_threads');
// const workFlowUtil = require('../utils/workflow-util');
// const assetUtil = require('../utils/assets.js');
// const { JobExecution } = require('../models');
// const { v4: uuidv4 } = require('uuid');
// const { log, dispatch } = require('./workerUtils')(parentPort);
//
// let isCancelled = false;
// if (parentPort) {
//   parentPort.once('message', message => {
//     if (message === 'cancel') isCancelled = true;
//   });
// }
//
// (async () => {
//   log('info', 'Send notification ...');
//   if (!workerData.jobExecutionGroupId) {
//     workerData.jobExecutionGroupId = uuidv4();
//   }
//
//   let execution;
//   try {
//     workerData.manualJob_meta.notifiedOn = new Date().getTime();
//     workerData.status = 'wait';
//     execution = await assetUtil.recordJobExecution(workerData);
//     workerData.url = `${process.env.WEB_URL}/${workerData.applicationId}/manualJobDetails/${workerData.jobId}/${execution}`;
//     await workFlowUtil.notifyManualJob(workerData);
//   } catch (err) {
//     if (execution) {
//       await JobExecution.update(
//         { status: 'error' },
//         { where: { id: execution } }
//       );
//     }
//     log('error', `Error in manualJob ${workerData.jobName}`, err);
//   } finally {
//     if (!workerData.isCronJob) dispatch('remove'); // REMOVE JOB FROM BREE IF ITS NOT CRON JOB!
//
//     if (parentPort) {
//       parentPort.postMessage('done');
//     } else {
//       process.exit(0);
//     }
//   }
// })();
