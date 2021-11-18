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
    const jobExecutions = await assetUtil.getJobEXecutionForProcessing();    
    if (jobExecutions.length === 0) {
      console.log("☕ NO JOBEXECUTIONS WITH STATUS 'SUBMITTED' HAS BEEN FOUND");
      console.log('------------------------------------------');
      return;
    }

   for (let i = 0; i < jobExecutions.length; i++) {
    const jobExecution = jobExecutions[i];
    if(jobExecution && jobExecution.wuid) {
      console.log('------------------------------------------');
      console.log(`💡 statusPoller.js: FOUND JOBEXECUTION FOR ${jobExecution.job.name}, (id:${jobExecution.id}) ${jobExecution.wuid} WITH STATUS= '${jobExecution.status}', PROCEED WITH CHECKING ON STATUS WITH HPCC`);
      // console.dir(jobExecution.toJSON());
      console.log('------------------------------------------')
  
      //check WU status
      const wuResult = await hpccUtil.workunitInfo(jobExecution.wuid, jobExecution.clusterId).catch(error =>{
        console.log('------------------------------------------');
        console.log(`❌ statusPoller.js: FAILED TO GET INFO ABOUT "${jobExecution.job.name}" - ${jobExecution.wuid} FROM HPCC`);
        console.dir(error);
        console.log('------------------------------------------');
        return { Workunit: { State: "failed" ,Jobname : jobExecution.job.name } }
      });              
      const WUstate = wuResult.Workunit.State;

      //update JobExecution
      if(WUstate === 'completed' || WUstate === 'wait' || WUstate === 'blocked' || WUstate === 'failed') {              
        const newjobExecution = { status: WUstate, wu_duration : wuResult.Workunit.TotalClusterTime || null };
        const result = await jobExecution.update(newjobExecution,{where:{id:jobExecution.id}});
        console.log('------------------------------------------');
        console.log(`✔️ statusPoller.js: JOB EXECUTION GOT UPDATED, ("${jobExecution.job.name}") ${result.wuid} = ${result.status} ${result.status === 'completed' ? "👍" : "🚩🚩🚩"}`);
        console.dir(result.toJSON());
        console.log(`✔️  JOBEXECUTION FOR "${jobExecution.job.name}" - ${jobExecution.wuid} IS ENDED`);
        console.log('------------------------------------------');
        if (WUstate  === 'failed') {
          console.log('------------------------------------------');
          console.log(`❌ statusPoller.js: SENDING EMAIL ABOUT "${jobExecution.job.name}" - ${jobExecution.wuid} FAILURE...📧`);
          console.log('------------------------------------------');
          await workflowUtil.notifyJobFailure({jobId:jobExecution.jobId, clusterId:jobExecution.clusterId,wuid:jobExecution.wuid})
        }else{
          console.log('------------------------------------------');
          console.log(`🔍 statusPoller.js: CHECKING JOBS DEPENDING ON "${jobExecution.job.name}" - ${jobExecution.wuid} - ${jobExecution.jobId}...`);
          console.log('------------------------------------------');
          await JobScheduler.scheduleCheckForJobsWithSingleDependency({ dependsOnJobId: jobExecution.jobId, dataflowId: jobExecution.dataflowId });    
        }
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