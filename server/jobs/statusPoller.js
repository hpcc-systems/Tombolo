const { parentPort, workerData } = require("worker_threads");
const hpccUtil = require('../utils/hpcc-util');
const assetUtil = require('../utils/assets.js');
const workflowUtil = require('../utils/workflow-util.js');
const JobScheduler = require('../job-scheduler');

let isCancelled = false;
if (parentPort) {
  parentPort.once('message', (message) => {
    if (message === 'cancel') isCancelled = true;
  });
}

(async () => {
  let wuResult, wuid='';
  try {
    let job = await assetUtil.getJobForProcessing();
    if(job && job.wuid) {
      //check WU status
      wuResult = await hpccUtil.workunitInfo(job.wuid, job.clusterId);    
      //check WU status
      if(wuResult.Workunit.State == 'completed' || wuResult.Workunit.State == 'wait' || wuResult.Workunit.State == 'blocked') {        
        let jobCompletionData = {
          jobId: job.jobId,
          applicationId: job.applicationId,
          dataflowId: job.dataflowId,
          wuid: job.wuid,
          clusterId: job.clusterId,
          status: wuResult.Workunit.State,
          wu_duration: wuResult.Workunit.TotalClusterTime
        };
        let jobComplettionRecorded = await assetUtil.recordJobExecution(jobCompletionData, job.wuid);      
      
        await JobScheduler.scheduleCheckForJobsWithSingleDependency(wuResult.Workunit.Jobname);    
      } else if(wuResult.Workunit.State == 'failed') {
        workflowUtil.notifyJobFailure(workerData.jobName, workerData.clusterId, job.wuid)
      }
    }    
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