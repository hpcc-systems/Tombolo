import logger from '../config/logger.js';
import path from 'path';
import { getDirname } from '../utils/polyfills.js';

const __dirname = getDirname(import.meta.url);

function createNewBreeJob(
  this: any,
  {
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
  }: {
    uniqueJobName: string;
    cron?: string;
    jobfileName: string;
    sprayedFileScope?: any;
    manualJob_meta?: any;
    sprayFileName?: string;
    sprayDropZone?: string;
    applicationId?: string;
    dataflowId?: string;
    dataflowVersionId?: string | null;
    clusterId?: string;
    metaData?: any;
    jobName?: string;
    contact?: string;
    jobType?: string;
    status?: string;
    jobId?: string;
    title?: string;
    jobExecutionGroupId?: string;
  }
): void {
  const job: any = {
    name: uniqueJobName,
    path: path.join(__dirname, '..', '..', 'dist', 'jobs', jobfileName),
    worker: {
      workerData: {
        WORKER_CREATED_AT: Date.now(),
        dataflowVersionId,
        sprayedFileScope,
        manualJob_meta,
        sprayFileName,
        sprayDropZone,
        applicationId,
        dataflowId,
        clusterId,
        metaData,
        jobName,
        contact,
        jobType,
        status,
        jobId,
        title,
        jobExecutionGroupId,
      },
    },
  };
  if (cron) {
    job.cron = cron;
    job.worker.workerData.isCronJob = true;
  } else {
    job.timeout = 0;
    job.worker.workerData.isCronJob = false;
  }
  this.bree.add(job);
}

async function removeJobFromScheduler(this: any, name: string): Promise<any> {
  try {
    const existingJob = this.bree.config.jobs.find(job => job.name === name);
    if (existingJob) {
      await this.bree.remove(name);
      logger.info(`📢 -Job removed from Bree ${existingJob.name}`);
      return { success: true, job: existingJob, jobs: this.bree.config.jobs };
    }
  } catch (err) {
    // Handle error
    logger.error('removeJobFromScheduler: ', err);
    return {
      success: false,
      message: err.message,
      jobs: this.bree.config.jobs,
    };
  }
}

async function removeAllFromBree(this: any, namePart: string): Promise<void> {
  try {
    const existingJobs = this.bree.config.jobs.filter(job =>
      job.name.includes(namePart)
    );
    if (existingJobs.length > 0) {
      for (const job of existingJobs) {
        try {
          await this.bree.remove(job.name);
          logger.info(`📢 -Job removed from Bree ${job.name}`);
        } catch (error) {
          logger.error(
            `removeAllFromBree - Failed to remove job ${job.name}: `,
            error
          );
        }
      }
    }
  } catch (err) {
    logger.error('removeAllFromBree: ', err);
  }
}

function getAllJobs(this: any): any[] {
  return this.bree.config.jobs;
}

async function stopJob(this: any, jobName: string): Promise<any> {
  const job = this.bree.config.jobs.find(job => job.name === jobName);
  try {
    if (job) {
      await this.bree.stop(jobName);
      return { success: true, job, jobs: this.bree.config.jobs };
    } else {
      return {
        success: false,
        message: 'job is not found',
        jobs: this.bree.config.jobs,
      };
    }
  } catch (err) {
    logger.error('stopJob: ', err);
    return {
      success: false,
      message: err.message,
      jobs: this.bree.config.jobs,
    };
  }
}

async function stopAllJobs(this: any): Promise<any> {
  try {
    const allJobs = [...this.bree.config.jobs];
    await this.bree.stop();
    return { success: true, jobs: allJobs };
  } catch (err) {
    logger.error('stopAllJobs: ', err);
    return {
      success: false,
      message: err.message,
      jobs: this.bree.config.jobs,
    };
  }
}

function startJob(this: any, jobName: string): any {
  const job = this.bree.config.jobs.find(job => job.name === jobName);
  try {
    if (job) {
      this.bree.start(jobName);
      return { success: true, job, jobs: this.bree.config.jobs };
    } else {
      return {
        success: false,
        message: 'job is not found',
        jobs: this.bree.config.jobs,
      };
    }
  } catch (err) {
    logger.error('startJob: ', err);
    return {
      success: false,
      message: err.message,
      jobs: this.bree.config.jobs,
    };
  }
}

function startAllJobs(this: any): any {
  try {
    const allJobs = [...this.bree.config.jobs];
    this.bree.start();
    return { success: true, jobs: allJobs };
  } catch (err) {
    logger.error('startAllJobs: ', err);
    return {
      success: false,
      message: err.message,
      jobs: this.bree.config.jobs,
    };
  }
}

function logBreeJobs(this: any): void {
  if (process.env.NODE_ENV === 'production') return; //do not polute logs during production;
  const jobs = this.bree.config.jobs;
  logger.verbose('📢 Bree jobs:');
  for (const job of jobs) {
    if (job.name.includes('job-status-poller')) continue; // hide status poller from logs
    if (job.name.includes('file-monitoring')) continue; // hide file monitoring from logs
    logger.verbose({
      name: job.name,
      cron: job.cron,
      jobName: job.worker?.workerData?.jobName,
      dataflowId: job.worker?.workerData?.dataflowId,
      dataflowVersionId: job.worker?.workerData?.dataflowVersionId,
      group: job.worker?.workerData?.jobExecutionGroupId,
    });
  }
}

export {
  createNewBreeJob,
  removeJobFromScheduler,
  removeAllFromBree,
  getAllJobs,
  stopJob,
  stopAllJobs,
  startJob,
  startAllJobs,
  logBreeJobs,
};
