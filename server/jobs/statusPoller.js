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
  try {
    const jobExecution = await assetUtil.getJobEXecutionForProcessing();
    if(jobExecution && jobExecution.wuid) {
      console.log('------------------------------------------');
      console.log(`statusPoller.js: FOUND JOBEXECUTION WITH STATUS= '${jobExecution.status}', PROCEED WITH CHECKING ON STATUS WITH HPCC`);
      console.dir(jobExecution.toJSON());
      console.log('------------------------------------------')
  
      //check WU status
      const wuResult = await hpccUtil.workunitInfo(jobExecution.wuid, jobExecution.clusterId);         
      const WUstate = wuResult.Workunit.State;

      //update JobExecution
      if(WUstate === 'completed' || WUstate === 'wait' || WUstate === 'blocked' || WUstate === 'failed') {              
        const newjobExecution = { status: WUstate, wu_duration : wuResult.Workunit.TotalClusterTime || null };
        const result = await jobExecution.update(newjobExecution);
        console.log('------------------------------------------');
        console.log(`statusPoller.js: JOB EXECUTION GOT UPDATED, ${result.wuid} = ${result.status}`);
        console.dir(result.toJSON());
        console.log('THIS JOBEXECUTION FLOW IS ENDED');
        console.log('------------------------------------------');
        if (WUstate  === 'failed') {
          console.log('------------------------------------------');
          console.log('statusPoller.js: SENDING EMAIL ABOUT FAILURE...');
          console.log('------------------------------------------');
          await workflowUtil.notifyJobFailure(wuResult.Workunit.Jobname, jobExecution.clusterId, jobExecution.wuid)
        }else{
          console.log('------------------------------------------');
          console.log('statusPoller.js: CHECKING FOR JOBS WITH SINGLE DEPENDENCY...');
          console.log('------------------------------------------');
          await JobScheduler.scheduleCheckForJobsWithSingleDependency(wuResult.Workunit.Jobname);    
        }
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