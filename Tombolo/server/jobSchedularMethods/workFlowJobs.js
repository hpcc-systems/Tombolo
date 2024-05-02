const { v4: uuidv4 } = require("uuid");

const models = require("../models");
const logger = require("../config/logger");
const workflowUtil = require("../utils/workflow-util");

const SUBMIT_JOB_FILE_NAME = "submitJob.js";
const SUBMIT_SPRAY_JOB_FILE_NAME = "submitSprayJob.js";
const SUBMIT_SCRIPT_JOB_FILE_NAME = "submitScriptJob.js";
const SUBMIT_MANUAL_JOB_FILE_NAME = "submitManualJob.js";
const SUBMIT_GITHUB_JOB_FILE_NAME = "submitGithubJob.js";
const SUBMIT_QUERY_PUBLISH = "submitQueryPublish.js";

const DataflowVersions = models.dataflow_versions;
const JobExecution = models.job_execution;
const Job = models.job;
const MessageBasedJobs = models.message_based_jobs;

async function scheduleCheckForJobsWithSingleDependency({
  dependsOnJobId,
  dataflowId,
  dataflowVersionId,
  jobExecutionGroupId,
}) {
  try {
    const dataflowVersion = await DataflowVersions.findOne({
      where: { id: dataflowVersionId },
      attributes: ["graph"],
    });
    if (!dataflowVersion) throw new Error("Dataflow version does not exist");

    let dependentJobs = dataflowVersion.graph.cells.reduce((acc, cell) => {
      if (cell?.data?.schedule?.dependsOn?.includes(dependsOnJobId))
        acc.push({ jobId: cell.data.assetId });
      return acc;
    }, []);

    if (dependentJobs.length === 0 && dataflowId) {
      try {
        logger.info(
          "WORKFLOW EXECUTION COMPLETE, Checking if subscribed for notifications."
        );
        await workflowUtil.notifyWorkflow({
          dataflowId,
          jobExecutionGroupId,
          status: "completed",
        });
      } catch (error) {
        logger.error("WORKFLOW EXECUTION COMPLETE NOTIFICATION FAILED", error);
      }
    } else {
      logger.verbose(`✔️  FOUND ${dependentJobs.length} DEPENDENT JOB/S`);
      //List of dependent job ids
      let dependentJobsIds = dependentJobs.map((job) => job.jobId);
      //Check if any of the dependent job are already in submitted state
      const activeJobs = await JobExecution.findAll({
        where: {
          dataflowId: dataflowId,
          jobId: dependentJobsIds,
          status: ["submitted", "blocked"],
        },
        attributes: ["jobId"],
        raw: true,
      });
      const activeJobIds = activeJobs.map((activeJob) => activeJob.jobId);
      //Remove already submitted jobs from dependent jobs array
      dependentJobs = dependentJobs.filter(
        (dependentJob) => !activeJobIds.includes(dependentJob.jobId)
      );

      for (const dependentJob of dependentJobs) {
        try {
          let job = await Job.findOne({ where: { id: dependentJob.jobId } });
          let status;
          const isSprayJob = job.jobType == "Spray";
          const isScriptJob = job.jobType == "Script";
          const isManualJob = job.jobType === "Manual";
          const isQueryPublishJob = job.jobType === "Query Publish";

          const isGitHubJob = job.metaData?.isStoredOnGithub;

          logger.info(
            `🔄 EXECUTING DEPENDANT JOB "${job.name}" id:${job.id}; dflow: ${dataflowId};`
          );

          const commonWorkerData = {
            applicationId: job.application_id,
            clusterId: job.cluster_id,
            dataflowId: dataflowId,
            jobExecutionGroupId,
            jobType: job.jobType,
            dataflowVersionId,
            jobName: job.name,
            title: job.title,
            jobId: job.id,
          };

          if (isSprayJob) {
            status = this.executeJob({
              ...commonWorkerData,
              sprayFileName: job.sprayFileName,
              sprayDropZone: job.sprayDropZone,
              sprayedFileScope: job.sprayedFileScope,
              jobfileName: SUBMIT_SPRAY_JOB_FILE_NAME,
            });
          } else if (isScriptJob) {
            status = this.executeJob({
              jobfileName: SUBMIT_SCRIPT_JOB_FILE_NAME,
              ...commonWorkerData,
            });
          } else if (isManualJob) {
            status = this.executeJob({
              ...commonWorkerData,
              status: "wait",
              jobfileName: SUBMIT_MANUAL_JOB_FILE_NAME,
              manualJob_meta: {
                jobType: "Manual",
                jobName: job.name,
                notifiedTo: job.contact,
              },
            });
          } else if (isGitHubJob) {
            status = this.executeJob({
              ...commonWorkerData,
              metaData: job.metaData,
              jobfileName: SUBMIT_GITHUB_JOB_FILE_NAME,
            });
          } else if (isQueryPublishJob) {
            status = this.executeJob({
              jobfileName: SUBMIT_QUERY_PUBLISH,
              ...commonWorkerData,
            });
          } else {
            status = this.executeJob({
              jobfileName: SUBMIT_JOB_FILE_NAME,
              ...commonWorkerData,
            });
          }
          if (!status.success) throw status;
        } catch (error) {
          // failed to execute dependent job through bree. User will be notified inside worker
          logger.error("Failed to execute dependent job through bree", error);
        }
      }
    }
  } catch (error) {
    logger.error(error);
    const message = `Error happened while trying to execute workflow, try to 'Save version' and execute it again. | Error: ${error.message} `;
    await workflowUtil.notifyWorkflow({
      dataflowId,
      jobExecutionGroupId,
      status: "error",
      exceptions: message,
    });
  }
}

function executeJob(jobData) {
  try {
    let uniqueJobName =
      jobData.jobName +
      "-" +
      jobData.dataflowId +
      "-" +
      jobData.jobId +
      "-" +
      uuidv4();
    this.createNewBreeJob({ ...jobData, uniqueJobName });
    this.bree.start(uniqueJobName);
    logger.info(`✔️  BREE HAS STARTED JOB: "${uniqueJobName}"`);
    this.logBreeJobs();

    return {
      success: true,
      message: `Successfully executed ${jobData.jobName}`,
    };
  } catch (err) {
    logger.error(err);
    return {
      success: false,
      contact: jobData.contact,
      jobName: jobData.jobName,
      clusterId: jobData.clusterId,
      dataflowId: jobData.dataflowId,
      message: `Error executing  ${jobName} - ${err.message}`,
    };
  }
}

async function scheduleActiveCronJobs() {
  try {
    // get all active graphs
    const dataflowsVersions = await DataflowVersions.findAll({
      where: { isLive: true },
      attributes: ["id", "graph", "dataflowId"],
    });

    for (const dataflowsVersion of dataflowsVersions) {
      const cronScheduledNodes =
        dataflowsVersion.graph?.cells?.filter(
          (cell) => cell.data?.schedule?.cron
        ) || [];
      if (cronScheduledNodes.length > 0) {
        for (const node of cronScheduledNodes) {
          try {
            const job = await Job.findOne({
              where: { id: node.data.assetId },
            });
            if (!job) throw new Error(`Failed to schedule job ${job.name}`);

            const isSprayJob = job.jobType == "Spray";
            const isScriptJob = job.jobType == "Script";
            const isManualJob = job.jobType === "Manual";
            const isGitHubJob = job.metaData?.isStoredOnGithub;

            const workerData = {
              dataflowVersionId: dataflowsVersion.id,
              dataflowId: dataflowsVersion.dataflowId,
              applicationId: job.application_id,
              cron: node.data.schedule.cron,
              clusterId: job.cluster_id,
              jobType: job.jobType,
              jobName: job.name,
              title: job.title,
              jobId: job.id,
              skipLog: true,
            };

            workerData.jobfileName = SUBMIT_JOB_FILE_NAME;

            if (isScriptJob)
              workerData.jobfileName = SUBMIT_SCRIPT_JOB_FILE_NAME;
            if (isSprayJob) {
              workerData.jobfileName = SUBMIT_SPRAY_JOB_FILE_NAME;
              workerData.sprayedFileScope = job.sprayedFileScope;
              workerData.sprayFileName = job.sprayFileName;
              workerData.sprayDropZone = job.sprayDropZone;
            }
            if (isManualJob) {
              workerData.manualJob_meta = {
                jobType: "Manual",
                jobName: job.name,
                notifiedTo: job.contact,
                notifiedOn: new Date().getTime(),
              };
              workerData.jobfileName = SUBMIT_MANUAL_JOB_FILE_NAME;
              workerData.contact = job.contact;
            }
            if (isGitHubJob) {
              workerData.jobfileName = SUBMIT_GITHUB_JOB_FILE_NAME;
              workerData.metaData = job.metaData;
            }
            // finally add the job to the scheduler
            this.addJobToScheduler(workerData);
          } catch (error) {
            logger.error(error);
          }
        }
      }
    }
  } catch (error) {
    logger.error(error);
  }
  logger.verbose(
    `📢 ACTIVE CRON JOBS (${this.bree.config.jobs.length}) (does not include dependent jobs):`
  );
  this.logBreeJobs();
}

async function scheduleMessageBasedJobs(message) {
  try {
    let job = await Job.findOne({
      where: { name: message.jobName },
      attributes: { exclude: ["assetId"] },
    });
    if (job) {
      let messageBasedJobs = await MessageBasedJobs.findAll({
        where: { jobId: job.id },
      });
      for (const messageBasedjob of messageBasedJobs) {
        this.executeJob({
          jobId: job.id,
          jobName: job.name,
          jobType: job.jobType,
          clusterId: job.cluster_id,
          sprayFileName: job.sprayFileName,
          sprayDropZone: job.sprayDropZone,
          sprayedFileScope: job.sprayedFileScope,
          dataflowId: messageBasedjob.dataflowId,
          applicationId: messageBasedjob.applicationId,
          jobfileName:
            job.jobType == "Script"
              ? SUBMIT_SCRIPT_JOB_FILE_NAME
              : SUBMIT_JOB_FILE_NAME,
        });
      }
    } else {
      logger.warn("📢 COULD NOT FIND JOB WITH NAME " + message.jobName);
    }
  } catch (err) {
    logger.error(err);
  }
}

function addJobToScheduler({ skipLog = false, ...jobData }) {
  try {
    let uniqueJobName =
      jobData.jobName + "-" + jobData.dataflowId + "-" + jobData.jobId;
    this.createNewBreeJob({ uniqueJobName, ...jobData });
    this.bree.start(uniqueJobName);

    logger.info(
      `📢 JOB WAS SCHEDULED AS - ${uniqueJobName},  job-scheduler.js: addJobToScheduler`
    );
    !skipLog && this.logBreeJobs();

    return { success: true };
  } catch (err) {
    logger.error(err);
    const part2 = err.message.split(" an ")?.[1]; // error message is not user friendly, we will trim it to have everything after "an".
    if (part2) err.message = part2;
    return { success: false, error: err.message };
  }
}

module.exports = {
  scheduleCheckForJobsWithSingleDependency,
  executeJob,
  scheduleActiveCronJobs,
  scheduleMessageBasedJobs,
  addJobToScheduler,
};
