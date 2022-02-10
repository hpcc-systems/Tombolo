const { parentPort, workerData } = require("worker_threads");
const hpccUtil = require('../utils/hpcc-util');
const assetUtil = require('../utils/assets.js');
const workflowUtil = require('../utils/workflow-util.js');


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
    const jobExecutions = await assetUtil.getJobEXecutionForProcessing();   
    if (jobExecutions.length === 0) {
      logToConsole('☕ NO JOBEXECUTIONS WITH STATUS "SUBMITTED" HAS BEEN FOUND');
      return;
    }

   for (let i = 0; i < jobExecutions.length; i++) {
    const jobExecution = jobExecutions[i];
    if(jobExecution && jobExecution.wuid) {
      logToConsole(`💡  FOUND JOBEXECUTION FOR ${jobExecution.job.name}, (id:${jobExecution.id}) ${jobExecution.wuid} WITH STATUS= '${jobExecution.status}', PROCEED WITH CHECKING ON STATUS WITH HPCC`);
      //logToConsole(jobExecution.toJSON());
  
      //check WU status
      const wuResult = await hpccUtil.workunitInfo(jobExecution.wuid, jobExecution.clusterId).catch(error =>{
        logToConsole(`❌  FAILED TO GET INFO ABOUT "${jobExecution.job.name}" - ${jobExecution.wuid} FROM HPCC`);
        logToConsole(error);
        return { Workunit: { State: "failed" ,Jobname : jobExecution.job.name } }
      });              
      const WUstate = wuResult.Workunit.State;

      //update JobExecution
      if(WUstate === 'completed' || WUstate === 'wait' || WUstate === 'blocked' || WUstate === 'failed') {              
        const newjobExecution = { status: WUstate, wu_duration : wuResult.Workunit.TotalClusterTime || null };
        const result = await jobExecution.update(newjobExecution,{where:{id:jobExecution.id}}); 
        logToConsole(`✔️  JOB EXECUTION GOT UPDATED, ("${jobExecution.job.name}") ${result.wuid} = ${result.status} ${result.status === 'completed' ? "👍" : "🚩🚩🚩"}`);
        logToConsole(result.toJSON());
        if(WUstate === 'completed' || WUstate === 'failed'){
           if(WUstate === 'completed'){
              logToConsole(`🔍  WORKER_THREAD IS DONE, PASSING CHECKING ON DEPENDING JOBS TO MAIN THREAD, "${jobExecution.job.name}" - ${jobExecution.wuid} - ${jobExecution.jobId}...`);
              // will trigger JobScheduler.scheduleCheckForJobsWithSingleDependency on main thread.
              dispatchAction('scheduleDependentJobs',{ dependsOnJobId: jobExecution.jobId, dataflowId: jobExecution.dataflowId, jobExecutionGroupId: jobExecution.jobExecutionGroupId });
              // await JobScheduler.scheduleCheckForJobsWithSingleDependency({ dependsOnJobId: jobExecution.jobId, dataflowId: jobExecution.dataflowId });    
        }
          await workflowUtil.notifyJobExecutionStatus({jobId:jobExecution.jobId, clusterId:jobExecution.clusterId,wuid:jobExecution.wuid, WUstate})
        }
      } 
    }    
  }
  } catch (err) {
    logToConsole(err);
  } finally {
    if (parentPort) {           
      parentPort.postMessage('done');      
    } else {
      process.exit(0);
    }
  }
})();