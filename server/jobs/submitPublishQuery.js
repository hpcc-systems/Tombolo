const { parentPort, workerData } = require("worker_threads");
const { v4: uuidv4 } = require("uuid");

const workflowUtil = require("../utils/workflow-util");
const assetUtil = require('../utils/assets.js');
const hpccUtil = require('../utils/hpcc-util');

const { log, dispatch } = require('./workerUtils')(parentPort);

let isCancelled = false;
if (parentPort) {
  parentPort.once('message', (message) => {
    if (message === 'cancel') isCancelled = true;
  });
}

(async () => { 
  try {
    if(!workerData.jobExecutionGroupId) workerData.jobExecutionGroupId = uuidv4();

    const {clusterId, jobName, dataflowId, jobId, jobExecutionGroupId } = workerData;
    log('info',`Started Query Publish job ${jobName} | clusterId: ${clusterId} | dataflowId : ${dataflowId}`)

    const result = await hpccUtil.getJobWuDetails(clusterId, jobName, dataflowId, 'roxie');
    if (!result) throw new Error(`Failed to get data about job: ${jobName}`);
   
    const  { wuid, wuService } = result;
    log("info", `${workerData.jobName} (WU: ${wuid}) publishing`);
    
    const response = await wuService.WUPublishWorkunit({
      Wuid: wuid,
      JobName: jobName,
      Cluster: "roxie",
      // https://discoverylab.hpcc.risk.regn.net:18010/WsWorkunits/WUPublishWorkunit?ver_=1.8&form  | default props must be included in order to work;
      Activate: 1,
      NotifyCluster: false,
      Wait: 10000,
      NoReload: false,
      UpdateWorkUnitName: false,
      DontCopyFiles: false,
      AllowForeignFiles: false,
      UpdateDfs: false,
      UpdateSuperFiles: false,
      UpdateCloneFrom: false,
      AppendCluster: true,
      IncludeFileErrors: false,
    });
        
    if (response.Exceptions?.Exception?.length  > 0){
      const message = response.Exceptions.Exception.map(exception => exception.Message).join(', ');
      throw new Error(message);
    }

    const WU = await wuService.WUInfo({ Wuid: response.Wuid });
    const status = WU.Workunit?.State;
    if (!status) throw new Error(`Failed to get status on ${jobName} | ${response.Wuid}`)
    
    workerData.status = status;
    await assetUtil.recordJobExecution(workerData, response.Wuid);

    log("info", `Job "${jobName}" is ${status}, checking if notification required...`);
    await workflowUtil.notifyJob({ dataflowId, jobExecutionGroupId, jobId, status });
    
    if (status !== 'compiled') {
      // Try to notify on dataflow level about failure and exit, do not schedule next job;
      log('error' ,`Publish Query status is not compiled: status = ${status}`)
      return await workflowUtil.notifyWorkflow({ dataflowId, jobExecutionGroupId, jobName, status, exceptions: error.message});
    }

    if (dataflowId) {
      dispatch("scheduleNext", { dependsOnJobId: jobId, dataflowId, jobExecutionGroupId });
    }

  } catch (error) {
    log('error', 'Publish Query error', error);
    workerData.status = 'error';
    await assetUtil.recordJobExecution(workerData, '');
        
    const {jobId, jobName, dataflowId, jobExecutionGroupId } = workerData;

    await workflowUtil.notifyJob({ dataflowId, jobExecutionGroupId, jobId, status: 'error' });
    await workflowUtil.notifyWorkflow({ dataflowId, jobExecutionGroupId, jobName, status: 'error' });
  } finally{
    if (!workerData.isCronJob) dispatch("remove");   // REMOVE JOB FROM BREE IF ITS NOT CRON JOB!
    parentPort ? parentPort.postMessage("done") : process.exit(0);
  }
})();