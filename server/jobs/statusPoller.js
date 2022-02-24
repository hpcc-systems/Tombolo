const { parentPort, workerData } = require('worker_threads');
const hpccUtil = require('../utils/hpcc-util');
const assetUtil = require('../utils/assets.js');
const workflowUtil = require('../utils/workflow-util.js');
const models = require('../models');
const Dataflow = models.dataflow;
const Cluster = models.cluster;

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
              dispatchAction('scheduleDependentJobs',{ dependsOnJobId: jobExecution.jobId, dataflowId: jobExecution.dataflowId, jobExecutionGroupId: jobExecution.jobExecutionGroupId, });
              // await JobScheduler.scheduleCheckForJobsWithSingleDependency({ dependsOnJobId: jobExecution.jobId, dataflowId: jobExecution.dataflowId });
            }else{
                 //If failed
              if (jobExecution.dataValues?.dataflowId) {
                try {
                  const dataflow = await Dataflow.findOne({ where: { id: jobExecution.dataValues?.dataflowId } });
                  const cluster = await Cluster.findOne({ where: { id: jobExecution.clusterId } });
                  const wuURL = `${cluster.thor_host}:${cluster.thor_port}/?Wuid=${wuResult.Workunit.Wuid}&Widget=WUDetailsWidget`;
                  const workFlowURL = `${process.env.WEB_URL}/${dataflow.application_id}/dataflowinstances/dataflowInstanceDetails/${dataflow.id}/${jobExecution.jobExecutionGroupId}`
                  if (dataflow.dataValues?.metaData?.notification?.notify === 'Always' || dataflow.dataValues?.metaData?.notification?.notify === 'Only on failure') {
                    const notificationBody = `<div>
                                              <p>${dataflow.dataValues?.metaData?.notification?.failure_message} </p>
                                              <p>Hello,</p> <p> <b>${jobExecution.job.name}</b> from  
                                              <b>${dataflow.title}</b> <span style="color : red; font-weight: 700"> FAILED </span> on cluster <b>
                                              ${cluster.name} </b>.</p>
                                              <p>To view workflow execution details in Tombolo, please click here <a href="${workFlowURL}"> here </a></p>
                                              <p>To view details in HPCC , please click <a href = '${wuURL}'> here </a></p>
                                              </div>
                                              `;

                    await workflowUtil.notifyWorkflowExecutionStatus({recipients: dataflow.dataValues?.metaData?.notification?.recipients, subject : 'Workflow failed', message : notificationBody});
                  }else{ // Error notification not configured at job level -> notify user if error failure message configured at job level
                    await workflowUtil.notifyJobExecutionStatus({ jobId: jobExecution.jobId, clusterId: jobExecution.clusterId, wuid: jobExecution.wuid, WUstate });
                  }
                } catch (err) {
                  console.log('------------------------------------------');
                  console.log(err);
                  console.log('------------------------------------------');
                }
              } else { // Job not a part or Workflow. notify status if configured at job level
                await workflowUtil.notifyJobExecutionStatus({ jobId: jobExecution.jobId, clusterId: jobExecution.clusterId, wuid: jobExecution.wuid, WUstate });
              }
            }
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