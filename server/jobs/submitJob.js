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
  try {
    let wuid = await hpccUtil.getJobWuidByName(workerData.clusterId, workerData.jobName);
    console.log(
    `submitting job ${workerData.jobName} ` +
    `(WU: ${wuid}) to url ${workerData.clusterId}/WsWorkunits/WUResubmit.json?ver_=1.78`
    );
    let wuInfo = await hpccUtil.resubmitWU(workerData.clusterId, wuid);
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
        wuid: wuid,
        clusterId: workerData.clusterId,
        status: 'submitted'
      }
    }).then((results, created) => {
      let jobExecutionId = results[0].id;
      if(!created) {
        return JobExecution.update({
          jobId: workerData.jobId,
          dataflowId: workerData.dataflowId,
          applicationId: workerData.applicationId,
          wuid: wuid,
          status: 'submitted'
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