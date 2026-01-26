import { parentPort, workerData } from 'worker_threads';
import { v4 as uuidv4 } from 'uuid';

import workflowUtil from '../utils/workflow-util.js';
import assetUtil from '../utils/assets.js';
import hpccUtil from '../utils/hpcc-util.js';
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
  try {
    if (!workerData.jobExecutionGroupId)
      workerData.jobExecutionGroupId = uuidv4();

    const {
      clusterId,
      jobName,
      dataflowId,
      jobId,
      jobExecutionGroupId,
      dataflowVersionId,
    } = workerData;
    log(
      'info',
      `Started Query Publish job ${jobName} | clusterId: ${clusterId} | dataflowId : ${dataflowId} | dfVersion: ${dataflowVersionId}`
    );

    const result = await hpccUtil.getJobWuDetails(
      clusterId,
      jobName,
      dataflowId,
      'roxie'
    );
    if (!result) throw new Error(`Failed to get data about job: ${jobName}`);

    const { wuid, wuService } = result;
    log('info', `${workerData.jobName} (WU: ${wuid}) publishing`);

    const response = await wuService.WUPublishWorkunit({
      Wuid: wuid,
      JobName: jobName,
      Cluster: 'roxie',
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

    if (response.Exceptions?.Exception?.length > 0) {
      const message = response.Exceptions.Exception.map(
        exception => exception.Message
      ).join(', ');
      throw new Error(message);
    }

    const WU = await wuService.WUInfo({ Wuid: response.Wuid });
    const status = WU.Workunit?.State;
    if (!status)
      throw new Error(`Failed to get status on ${jobName} | ${response.Wuid}`);

    workerData.status = status;
    await assetUtil.recordJobExecution(workerData, response.Wuid);

    log(
      'info',
      `Job "${jobName}" is ${status}, checking if notification required...`
    );
    await workflowUtil.notifyJob({
      dataflowId,
      jobExecutionGroupId,
      jobId,
      status,
    });

    if (status !== 'compiled') {
      // Try to notify on dataflow level about failure and exit, do not schedule next job;
      log('error', `Publish Query status is not compiled: status = ${status}`);
      return await workflowUtil.notifyWorkflow({
        dataflowId,
        jobExecutionGroupId,
        jobName,
        status,
        exceptions: 'Failed to compile',
      });
    }

    if (dataflowId) {
      dispatch('scheduleNext', {
        dependsOnJobId: jobId,
        dataflowId,
        dataflowVersionId,
        jobExecutionGroupId,
      });
    }
  } catch (error) {
    log('error', 'Publish Query error', error);
    workerData.status = 'error';
    await assetUtil.recordJobExecution(workerData, '');

    const { jobId, jobName, dataflowId, jobExecutionGroupId } = workerData;

    await workflowUtil.notifyJob({
      dataflowId,
      jobExecutionGroupId,
      jobId,
      status: 'error',
    });
    await workflowUtil.notifyWorkflow({
      dataflowId,
      jobExecutionGroupId,
      jobName,
      status: 'error',
    });
  } finally {
    if (!workerData.isCronJob) dispatch('remove'); // REMOVE JOB FROM BREE IF ITS NOT CRON JOB!
    parentPort ? parentPort.postMessage('done') : process.exit(0);
  }
})();
