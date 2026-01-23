import { parentPort } from 'worker_threads';
import hpccUtil from '../utils/hpcc-util.js';
import assetUtil from '../utils/assets.js';
import workflowUtil from '../utils/workflow-util.js';
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
    const jobExecutions = await assetUtil.getJobEXecutionForProcessing();
    if (jobExecutions.length === 0)
      return log(
        'verbose',
        '☕ NO JOBEXECUTIONS WITH STATUS "SUBMITTED" HAS BEEN FOUND'
      );

    for (let jobExecution of jobExecutions) {
      // if there is no WUID in job execution then we have nothing to do here;
      if (!jobExecution?.wuid) continue;

      log(
        'info',
        `💡  FOUND JOBEXECUTION FOR ${jobExecution.job.name}, (id:${jobExecution.id}) ${jobExecution.wuid} WITH STATUS= '${jobExecution.status}', PROCEED WITH CHECKING ON STATUS WITH HPCC`
      );
      // Main config object
      const WUResult = {
        State: '',
        Exceptions: '',
        TotalClusterTime: null,
      };

      try {
        // Getting info about WU from HPCC
        const WUinfo = await hpccUtil.workunitInfo(
          jobExecution.wuid,
          jobExecution.clusterId
        );

        // Workunit is found
        if (WUinfo.Workunit) {
          ((WUResult.State = WUinfo.Workunit.State),
            (WUResult.TotalClusterTime =
              WUinfo.Workunit?.TotalClusterTime || null));
        } else {
          // Workunit is not found
          WUResult.State = 'error';
          const exceptions = WUinfo.Exceptions?.Exception;
          if (exceptions.length > 0) {
            WUResult.Exceptions = exceptions
              .map(exception => exception.Message)
              .join(', ');
            log(
              'error',
              `EXCEPTIONS RECEIVED WHEN TRIED TO QUERY ${jobExecution.job.name} ${jobExecution.wuid}: ${WUResult.Exceptions}`
            );
          }
        }
      } catch (error) {
        // Failed to send request to get WUinfo
        log('error', 'workunitInfo', error);
        WUResult.State = 'error';
      }

      // possible WU states, if any of this states match WU state we will update our db accordingly
      const statuses = ['completed', 'wait', 'blocked', 'failed', 'error'];

      if (statuses.includes(WUResult.State)) {
        //update JobExecution
        jobExecution = await jobExecution.update({
          status: WUResult.State,
          wu_duration: WUResult.TotalClusterTime,
        });
        const {
          wuid,
          jobId,
          status,
          id,
          jobExecutionGroupId,
          dataflowId = '',
          dataflowVersionId = '',
        } = jobExecution;
        const { name: jobName } = jobExecution.job;

        log(
          'info',
          `✔️  JOB EXECUTION GOT UPDATED, ("${jobName}") ${id} ${wuid} = ${status} ${status === 'completed' ? '👍' : '🚩🚩🚩'}`
        );
        log('verbose', jobExecution.toJSON());

        // WU state is completed, notify users, proceed to next job if executed in dataflow
        if (WUResult.State === 'completed') {
          log(
            'verbose',
            `🔍  WORKER_THREAD IS DONE, "${jobName}" - ${wuid} - ${jobId}`
          );
          log(
            'info',
            `Job "${jobName}" is completed, checking if notification required...`
          );
          await workflowUtil.notifyJob({
            dataflowId,
            jobExecutionGroupId,
            jobId,
            wuid,
            status: WUResult.State,
          });

          // Executed a single Job and we are done.
          if (!dataflowId) continue;
          // Go to next job execution
          log(
            'info',
            `CHECKING ON DEPENDING JOBS, dataflow: ${dataflowId} | jobExecutionGroupId : ${jobExecutionGroupId}`
          );
          dispatch('scheduleNext', {
            dependsOnJobId: jobId,
            dataflowId,
            dataflowVersionId,
            jobExecutionGroupId,
          });
        }

        // WU state is failed|error, notify users
        if (WUResult.State === 'failed' || WUResult.State === 'error') {
          log(
            'error',
            `Job "${jobName}" failed checking if notification required...`
          );
          await workflowUtil.notifyJob({
            dataflowId,
            jobExecutionGroupId,
            jobId,
            wuid,
            status: WUResult.State,
            exceptions: WUResult.Exceptions,
          });
          await workflowUtil.notifyWorkflow({
            dataflowId,
            jobExecutionGroupId,
            jobName,
            wuid,
            status: WUResult.State,
            exceptions: WUResult.Exceptions,
          });
        }
      }
    }
  } catch (error) {
    log('error', 'Error in Status Poller', error);
  } finally {
    parentPort ? parentPort.postMessage('done') : process.exit(0);
  }
})();
