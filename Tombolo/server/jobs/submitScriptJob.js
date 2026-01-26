import { parentPort, workerData } from 'worker_threads';
import { v4 as uuidv4 } from 'uuid';
import assetUtil from '../utils/assets.js';
import workerUtils from './workerUtils.js';

const { log, dispatch } = workerUtils(parentPort);

// eslint-disable-next-line no-unused-vars
let isCancelled = false;
if (parentPort) {
  parentPort.once('message', message => {
    if (message === 'cancel') isCancelled = true;
  });
}

(async () => {
  if (!workerData.jobExecutionGroupId) {
    workerData.jobExecutionGroupId = uuidv4();
  }

  try {
    log('info', 'running script job: ' + workerData.jobId);
    let executionResult = await assetUtil.executeScriptJob(workerData.jobId);
    log('info', executionResult);
    //record workflow execution
    //since it is a script job, there is no easy way to identify the completion status, hence marking as completed after invoking the script job
    //in future if script jobs can return back a proper status, this can be changed
    workerData.status = 'completed';
    await assetUtil.recordJobExecution(workerData, '');
  } catch (err) {
    log('error', `Error in submitScriptJob ${workerData.jobName}`, err);
    workerData.status = 'failed';
    await assetUtil.recordJobExecution(workerData, '');
  } finally {
    if (!workerData.isCronJob) dispatch('remove'); // REMOVE JOB FROM BREE IF ITS NOT CRON JOB!

    if (parentPort) {
      parentPort.postMessage('done');
    } else {
      process.exit(0);
    }
  }
})();
