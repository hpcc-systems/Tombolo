const { parentPort, workerData } = require("worker_threads");
const request = require('request-promise');
const hpccUtil = require('../utils/hpcc-util');
const models = require('../models');
let JobExecution = models.job_execution;

let isCancelled = false;
if (parentPort) {
  parentPort.once('message', (message) => {
    if (message === 'cancel') isCancelled = true;
  });
}

(async () => {
  console.log(
    `submitting job ${workerData.jobName} ` +
    `(WU: ${workerData.workunitId}) to url ${workerData.cluster}/WsWorkunits/WUResubmit.json?ver_=1.78`
  );
  try {
    let wuInfo = await hpccUtil.resubmitWU(workerData.clusterId, workerData.workunitId);
    console.log(wuInfo)
    //record workflow execution
    await JobExecution.findOrCreate({
      where: {
        jobId: workerData.jobId,
        applicationId: workerData.applicationId
      },
      defaults: {
        jobId: workerData.jobId,
        dataflowId: workerData.dataflowId,
        applicationId: workerData.applicationId,
        status: 'completed',
        wuid: workerData.workunitId
      }
    }).then((results, created) => {
      let jobExecutionId = results[0].id;
      if(!created) {
        return JobExecution.update({
          jobId: workerData.jobId,
          dataflowId: workerData.dataflowId,
          applicationId: workerData.applicationId,
          status: 'completed',
          wuid: workerData.workunitId
        },
        {where: {id: jobExecutionId}})
      }
    })

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