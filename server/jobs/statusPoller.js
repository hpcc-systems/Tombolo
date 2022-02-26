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
            let workFlowURL, dataflow;
            const cluster = await Cluster.findOne({ where: { id: jobExecution.clusterId } });
            wuURL = `${cluster.thor_host}:${cluster.thor_port}/?Wuid=${wuResult.Workunit.Wuid}&Widget=WUDetailsWidget`;

            if(jobExecution.dataValues?.dataflowId){ // If job part of workflow build a URL
                  dataflow = await Dataflow.findOne({ where: { id: jobExecution.dataValues?.dataflowId } });
                  workFlowURL = `${process.env.WEB_URL}${dataflow.application_id}/dataflowinstances/dataflowInstanceDetails/${dataflow.id}/${jobExecution.jobExecutionGroupId}`
            }
             
            if(WUstate === 'completed'){
              logToConsole(`🔍  WORKER_THREAD IS DONE, PASSING CHECKING ON DEPENDING JOBS TO MAIN THREAD, "${jobExecution.job.name}" - ${jobExecution.wuid} - ${jobExecution.jobId}...`);
              //If the job just completed is  a part of a workflow + notification not set up at workflow level -> send notification if set at job level
              if(dataflow && dataflow?.metaData?.notification?.notify === 'Never' ){
                console.log('------------------------------------------');
                console.log('Job completed part of a workflow - No notification set at workflow level. User will be notified if notification is set at job level', )
                console.log('------------------------------------------');
                await workflowUtil.notifyJobExecutionStatus({ jobId: jobExecution.jobId, clusterId: jobExecution.clusterId, wuid: jobExecution.wuid, WUstate, wuURL, cluster, workFlowURL })
              }else{ //Job not a part of workflow
                console.log('------------------------------------------');
                console.log('Job completed not a part of a workflow (INDEPENDENT). User will be notified if notification is set at job level', )
                console.log('------------------------------------------');
                await workflowUtil.notifyJobExecutionStatus({ jobId: jobExecution.jobId, clusterId: jobExecution.clusterId, wuid: jobExecution.wuid, WUstate, wuURL, cluster })
              }
              
              dispatchAction('scheduleDependentJobs',{ dependsOnJobId: jobExecution.jobId, dataflowId: jobExecution.dataflowId, jobExecutionGroupId: jobExecution.jobExecutionGroupId, });
            }else{ // If job failed
              if(!dataflow){ //Failed job not a part of workflow. Notify if notification set at job level
                console.log('------------------------------------------');
                console.log('Job failed - Not a part of workflow (INDEPENDENT) -> Notify if notification set at job level', )
                console.log('------------------------------------------');
                await workflowUtil.notifyJobExecutionStatus({ jobId: jobExecution.jobId, clusterId: jobExecution.clusterId, wuid: jobExecution.wuid, WUstate, wuURL, cluster })
              }
              else if(dataflow && dataflow?.metaData?.notification?.notify === 'Never' ){ // Job failed part of workflow, but no notification set at workflow level
                console.log('------------------------------------------');
                console.log('Job failed part of a workflow - No notification set at workflow level. User will be notified if notification is set at job level', )
                console.log('------------------------------------------');
                await workflowUtil.notifyJobExecutionStatus({ jobId: jobExecution.jobId, clusterId: jobExecution.clusterId, wuid: jobExecution.wuid, WUstate, wuURL, workFlowURL })
              }else if(dataflow && dataflow?.metaData?.notification?.notify !== 'Never'){ //Job is part of workflow and notification set for failed jobs at workflow level.
                const{dataValues : {metaData : {notification : {failure_message, recipients}}}} = dataflow;
                 if (dataflow.dataValues?.metaData?.notification?.notify === 'Always' || dataflow.dataValues?.metaData?.notification?.notify === 'Only on failure') {
                    console.log('------------------------------------------');
                    console.log('Job failed - part of a workflow - Notification set at workflow level -> Notify', )
                    console.log('------------------------------------------');
                     await workflowUtil.notifyWorkflowExecutionStatus({recipients,
                       failure_message, 
                       executionStatus: 'failed', 
                       hpccURL : wuURL, 
                       jobName: jobExecution.job.name, 
                       dataflowName: dataflow.title, 
                       clusterName : cluster.name,
                      dataflowId: dataflow.id,
                      jobExecutionGroupId: jobExecution.jobExecutionGroupId,
                      appId: dataflow.application_id
                     });
              }
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