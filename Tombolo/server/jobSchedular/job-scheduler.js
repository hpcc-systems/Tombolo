const Bree = require("bree");

const logger = require("../config/logger.js");
const {
  logBreeJobs,
  createNewBreeJob,
  removeJobFromScheduler,
  removeAllFromBree,
  getAllJobs,
  stopJob,
  stopAllJobs,
  startJob,
  startAllJobs,
} = require("../jobSchedularMethods/breeJobs.js");
const {
  scheduleCheckForJobsWithSingleDependency,
  executeJob,
  scheduleActiveCronJobs,
  scheduleMessageBasedJobs,
  addJobToScheduler,
} = require("../jobSchedularMethods/workFlowJobs.js");
const {
  scheduleClusterTimezoneOffset,
  createClusterUsageHistoryJob,
  createClusterMonitoringBreeJob,
  scheduleClusterMonitoringOnServerStart,
} = require("../jobSchedularMethods/clusterJobs.js");
const {
  scheduleJobStatusPolling,
} = require("../jobSchedularMethods/hpccJobs.js");
const {
  createLandingZoneFileMonitoringBreeJob,
  createLogicalFileMonitoringBreeJob,
  createSuperFileMonitoringBreeJob,
  createDirectoryMonitoringBreeJob,
  scheduleDirectoryMonitoringOnServerStart,
  scheduleSuperFileMonitoringOnServerStart,
  scheduleFileMonitoringBreeJob,
  scheduleFileMonitoringOnServerStart,
  scheduleFileMonitoring,
} = require("../jobSchedularMethods/hpccFiles.js");
const { scheduleKeyCheck } = require("../jobSchedularMethods/apiKeys.js");
const {
  scheduleEmailNotificationProcessing,
  scheduleTeamsNotificationProcessing,
} = require("../jobSchedularMethods/notificationJobs.js");

const {
  createOrbitMegaphoneJob,
  createOrbitMonitoringJob,
  scheduleOrbitMonitoringOnServerStart,
} = require("../jobSchedularMethods/orbitJobs.js");


const {
  startJobMonitoring,
  startIntermediateJobsMonitoring,
} = require("../jobSchedularMethods/jobMonitoring.js");

class JobScheduler {
  constructor() {
    this.bree = new Bree({
      root: false,
      logger: false,
      errorHandler: (error, workerMetadata) => {
        if (workerMetadata.threadId) {
          logger.error(
            `There was an error while running a worker ${workerMetadata.name} with thread ID: ${workerMetadata.threadId}`,
            error
          );
        } else {
          logger.error(
            `There was an error while running a worker ${workerMetadata.name}`,
            error
          );
        }
      },
      workerMessageHandler: async (worker) => {
        // message type is <any>, when worker exits message ='done' by default.
        //To pass more props we use object {level?: info|verbose|error ; text?:any; error?: instanceof Error; action?: scheduleNext|remove; data?:any }
        const message = worker.message;
        let workerName = worker.name;
        if (workerName.includes("job-status-poller"))
          workerName = "Status poller";
        if (workerName.includes("file-monitoring"))
          workerName = "File monitoring";

        if (message === "done") {
          logger.verbose(`${workerName} signaled 'done'`);
        }
        if (message?.level === "verbose") {
          logger.verbose(`[${workerName}]:`);
          logger.verbose(message.text);
        }
        if (message?.level === "info") {
          logger.info(`[${workerName}]:`);
          logger.info(message.text);
        }
        if (message?.level === "error") {
          logger.error(`[${workerName}]:`);
          logger.error(`${message.text}`, message.error);
        }
        if (message?.action === "remove") {
          this.bree.remove(worker.name);
          logger.info(`👷 JOB REMOVED:  ${workerName}`);
        }
        if (message?.action == "scheduleNext") {
          await this.scheduleCheckForJobsWithSingleDependency({
            ...message.data,
          });
        }
      },
    });
  }

  bootstrap() {
    (async () => {
      await this.scheduleActiveCronJobs();
      await this.scheduleJobStatusPolling();
      await this.scheduleClusterTimezoneOffset();
      await this.scheduleFileMonitoring(); // file monitoring with templates - old file monitoring implementation
      await this.scheduleFileMonitoringOnServerStart();
      await this.scheduleSuperFileMonitoringOnServerStart();
      await this.scheduleClusterMonitoringOnServerStart();
      await this.scheduleKeyCheck();
      await this.createClusterUsageHistoryJob();
      await this.scheduleEmailNotificationProcessing();
      await this.scheduleTeamsNotificationProcessing();
      await this.scheduleOrbitMonitoringOnServerStart();
      await this.createOrbitMegaphoneJob();
      await this.startJobMonitoring();
      await this.startIntermediateJobsMonitoring();
      await this.scheduleDirectoryMonitoringOnServerStart();
    })();
  }

  //Bree related methods
  logBreeJobs() {
    return logBreeJobs.call(this);
  }
  createNewBreeJob({
    uniqueJobName,
    cron,
    jobfileName,
    sprayedFileScope,
    manualJob_meta,
    sprayFileName,
    sprayDropZone,
    applicationId,
    dataflowId,
    dataflowVersionId = null,
    clusterId,
    metaData,
    jobName,
    contact,
    jobType,
    status,
    jobId,
    title,
    jobExecutionGroupId,
  }) {
    return createNewBreeJob.call(this, {
      uniqueJobName,
      cron,
      jobfileName,
      sprayedFileScope,
      manualJob_meta,
      sprayFileName,
      sprayDropZone,
      applicationId,
      dataflowId,
      dataflowVersionId,
      clusterId,
      metaData,
      jobName,
      contact,
      jobType,
      status,
      jobId,
      title,
      jobExecutionGroupId,
    });
  }

  async removeJobFromScheduler(name) {
    return await removeJobFromScheduler.call(this, name);
  }

  async removeAllFromBree() {
    return await removeAllFromBree.call(this);
  }

  getAllJobs() {
    return getAllJobs.call(this);
  }

  async stopJob(jobName) {
    return await stopJob.call(this, jobName);
  }

  async stopAllJobs() {
    return await stopAllJobs.call(this);
  }

  startJob(jobName) {
    return startJob.call(this, jobName);
  }

  startAllJobs() {
    return startAllJobs.call(this);
  }

  // Jobs in a workflow
  scheduleCheckForJobsWithSingleDependency({
    dependsOnJobId,
    dataflowId,
    dataflowVersionId,
    jobExecutionGroupId,
  }) {
    scheduleCheckForJobsWithSingleDependency.call(this, {
      dependsOnJobId,
      dataflowId,
      dataflowVersionId,
      jobExecutionGroupId,
    });
  }

  executeJob(jobData) {
    return executeJob.call(this, jobData);
  }

  scheduleActiveCronJobs() {
    return scheduleActiveCronJobs.call(this);
  }

  scheduleMessageBasedJobs(message) {
    return scheduleMessageBasedJobs.call(this, message);
  }

  addJobToScheduler(jobData) {
    return addJobToScheduler.call(this, jobData);
  }

  // Cluster jobs
  scheduleClusterTimezoneOffset() {
    return scheduleClusterTimezoneOffset.call(this);
  }
  createClusterUsageHistoryJob() {
    return createClusterUsageHistoryJob.call(this);
  }

  createClusterMonitoringBreeJob({ clusterMonitoring_id, cron }) {
    return createClusterMonitoringBreeJob.call(this, {
      clusterMonitoring_id,
      cron,
    });
  }

  scheduleClusterMonitoringOnServerStart() {
    return scheduleClusterMonitoringOnServerStart.call(this);
  }

  scheduleJobStatusPolling() {
    return scheduleJobStatusPolling.call(this);
  }

  // file Monitoring
  createLandingZoneFileMonitoringBreeJob({ filemonitoring_id, name, cron }) {
    return createLandingZoneFileMonitoringBreeJob.call(this, {
      filemonitoring_id,
      name,
      cron,
    });
  }

  createLogicalFileMonitoringBreeJob({ filemonitoring_id, name, cron }) {
    return createLogicalFileMonitoringBreeJob.call(this, {
      filemonitoring_id,
      name,
      cron,
    });
  }

  createSuperFileMonitoringBreeJob({ filemonitoring_id, cron }) {
    return createSuperFileMonitoringBreeJob.call(this, {
      filemonitoring_id,
      cron,
    });
  }

  createDirectoryMonitoringBreeJob({ directoryMonitoring_id, name, cron }) {
    return createDirectoryMonitoringBreeJob.call(this, {
      directoryMonitoring_id,
      name,
      cron,
    });
  }

  scheduleDirectoryMonitoringOnServerStart() {
    return scheduleDirectoryMonitoringOnServerStart.call(this);
  }

  scheduleSuperFileMonitoringOnServerStart() {
    return scheduleSuperFileMonitoringOnServerStart.call(this);
  }

  scheduleFileMonitoringBreeJob({
    filemonitoring_id,
    name,
    cron,
    monitoringAssetType,
  }) {
    return scheduleFileMonitoringBreeJob.call(this, {
      filemonitoring_id,
      name,
      cron,
      monitoringAssetType,
    });
  }

  scheduleFileMonitoringOnServerStart() {
    return scheduleFileMonitoringOnServerStart.call(this);
  }

  scheduleFileMonitoring() {
    return scheduleFileMonitoring.call(this);
  }

  // API keys check
  scheduleKeyCheck() {
    return scheduleKeyCheck.call(this);
  }

  // Job monitoring
  startJobMonitoring() {
    return startJobMonitoring.call(this);
  }
  startIntermediateJobsMonitoring() {
    return startIntermediateJobsMonitoring.call(this);
  }

  //Process notification queue
  scheduleEmailNotificationProcessing() {
    return scheduleEmailNotificationProcessing.call(this);
  }
  scheduleTeamsNotificationProcessing() {
    return scheduleTeamsNotificationProcessing.call(this);
  }
  //orbit jobs
  createOrbitMegaphoneJob() {
    return createOrbitMegaphoneJob.call(this);
  }
  scheduleOrbitMonitoringOnServerStart() {
    return scheduleOrbitMonitoringOnServerStart.call(this);
  }

  createOrbitMonitoringJob({ orbitMonitoring_id, cron }) {
    return createOrbitMonitoringJob.call(this, { orbitMonitoring_id, cron });
  }
}

module.exports = new JobScheduler();
