const { parentPort, workerData } = require("worker_threads");
const { v4: uuidv4 } = require("uuid");
const hpccUtil = require("../utils/hpcc-util");
const assetUtil = require("../utils/assets.js");
const workflowUtil = require("../utils/workflow-util");
const { log, dispatch } = require("./workerUtils")(parentPort);

let isCancelled = false;
if (parentPort) {
  parentPort.once("message", (message) => {
    if (message === "cancel") isCancelled = true;
  });
}

(async () => {
  if (!workerData.jobExecutionGroupId) workerData.jobExecutionGroupId = uuidv4();

  const { clusterId, jobName, dataflowId } = workerData;

  try {
    log('info',`Started submitting job ${jobName} | clusterId: ${clusterId} | dataflowId : ${dataflowId}`);

    const result = await hpccUtil.getJobWuDetails(clusterId, jobName, dataflowId);
    if (!result) throw new Error(`Failed to get data about job: ${jobName}`);

    const { wuid, wuService } = result;
    log("info", `${workerData.jobName} (WU: ${wuid}) re-submitting`);

    const response = await wuService.WUResubmit({ Wuids: [wuid], CloneWorkunit: true, ResetWorkflow: false });

    if (response.Exceptions?.Exception?.length > 0) {
      const message = response.Exceptions.Exception.map((exception) => exception.Message).join(", ");
      throw new Error(message);
    }

    const resultWuid = response?.WUs?.WU?.[0]?.WUID; // this is new wuid created
    if (!resultWuid) throw new Error("Failed to get WU in respose");

    workerData.status = "submitted";
    await assetUtil.recordJobExecution(workerData, wuid);
  } catch (error) {
    log("error", `Error in job submit ${workerData.jobName}`, error);
    workerData.status = "error";
    await assetUtil.recordJobExecution(workerData, "");
    
    const {jobId, jobName, dataflowId, jobExecutionGroupId } = workerData;

    await workflowUtil.notifyJob({ dataflowId, jobExecutionGroupId, jobId, status: 'error', exceptions: error.message });
    await workflowUtil.notifyWorkflow({ dataflowId, jobExecutionGroupId, jobName, status: 'error', exceptions: error.message });
  } finally {
    if (!workerData.isCronJob) dispatch("remove"); // REMOVE JOB FROM BREE IF ITS NOT CRON JOB!
    parentPort ? parentPort.postMessage("done") : process.exit(0);
  }
})();