import Bree from 'bree';
import path from 'path';
import { pathToFileURL } from 'url';
import logger from '../config/logger.js';
import { getDirname } from '../utils/polyfills.js';
import {
  logBreeJobs,
  createNewBreeJob,
  removeJobFromScheduler,
  removeAllFromBree,
  getAllJobs,
  stopJob,
  stopAllJobs,
  startJob,
  startAllJobs,
} from '../jobSchedularMethods/breeJobs.js';

import {
  scheduleClusterTimezoneOffset,
  startClusterMonitoring,
  checkClusterReachability,
  checkClusterContainerization,
} from '../jobSchedularMethods/clusterJobs.js';

import {
  createLandingZoneFileMonitoringBreeJob,
  createLogicalFileMonitoringBreeJob,
  scheduleFileMonitoringBreeJob,
  // scheduleFileMonitoring,
} from '../jobSchedularMethods/hpccFiles.js';
import {
  scheduleEmailNotificationProcessing,
  //   scheduleTeamsNotificationProcessing,
} from '../jobSchedularMethods/notificationJobs.js';

import {
  startJobMonitoring,
  startIntermediateJobsMonitoring,
  startJobPunctualityMonitoring,
  startTimeSeriesAnalysisMonitoring,
  createWuInfoFetchingJob,
} from '../jobSchedularMethods/jobMonitoring.js';

import {
  // createOrbitMegaphoneJob,
  createOrbitProfileMonitoringJob,
  // scheduleOrbitMonitoringOnServerStart,
} from '../jobSchedularMethods/orbitJobs.js';

import {
  createMonitorCostJob,
  createAnalyzeCostJob,
} from '../jobSchedularMethods/costMonitoring.js';

import { createDataArchiveJob } from '../jobSchedularMethods/archive.js';

import {
  removeUnverifiedUser,
  sendPasswordExpiryEmails,
  sendAccountDeleteEmails,
} from '../jobSchedularMethods/userManagementJobs.js';

import {
  startLzFileMovementMonitoring,
  startLzFileCountMonitoring,
  startLzSpaceUsageMonitoring,
} from '../jobSchedularMethods/lzMonitoring.js';

class JobScheduler {
  bree: Bree;

  constructor() {
    // In dev, tsx's ESM hooks need to be explicitly re-registered in worker
    // threads because tsx skips registration when isMainThread is false.
    // The tsx-worker-loader.mjs preload script handles this.
    // In production (compiled dist/), workers run plain JS and don't need tsx.
    const __dirname = getDirname(import.meta.url);
    const tsxWorkerLoaderPath = path.resolve(
      __dirname,
      '..',
      'tsx-worker-loader.mjs'
    );
    const tsxWorkerLoader = pathToFileURL(tsxWorkerLoaderPath).toString();
    const isCompiled =
      __dirname.includes('/dist/') || __dirname.includes('\\dist\\');

    this.bree = new Bree({
      root: false,
      logger: false,
      worker: isCompiled
        ? { execArgv: [] }
        : { execArgv: ['--import', tsxWorkerLoader] },
      errorHandler: (error: any, workerMetadata: any) => {
        const baseMessage = `Error in worker ${workerMetadata.name}${
          workerMetadata.threadId
            ? ` (thread ID: ${workerMetadata.threadId})`
            : ''
        }`;
        logger.error(
          `${baseMessage}: ${error.message || 'Worker exited unexpectedly'}`,
          {
            errorStack: error.stack,
            workerMetadata,
            exitCode: error.code, // If available
          }
        );
      },
      workerMessageHandler: async (worker: any) => {
        // message type is <any>, when worker exits message ='done' by default.
        //To pass more props we use object {level?: info|verbose|error ; text?:any; error?: instanceof Error; action?: scheduleNext|remove; data?:any }

        if (
          worker.message?.type &&
          worker.message?.type === 'monitor-cost' &&
          worker.message?.action === 'trigger'
        ) {
          await this.createAnalyzeCostJob();
        }

        const message = worker.message;
        let workerName = worker.name;
        if (workerName.includes('job-status-poller'))
          workerName = 'Status poller';
        if (workerName.includes('file-monitoring'))
          workerName = 'File monitoring';

        if (message === 'done') {
          // Handle this is in Finally block
        }

        if (
          message?.level === 'warn' ||
          message?.level === 'info' ||
          message?.level === 'verbose' ||
          message?.level === 'debug' ||
          message?.level === 'silly'
        ) {
          logger[message.level](message.text);
        }

        if (message?.level === 'error') {
          logger.error(`${message.text}`, message.error);
        }

        if (message?.action === 'remove') {
          this.bree.remove(worker.name);
          logger.info(`Job removed:  ${workerName}`);
        }
      },
    });
  }

  bootstrap(): void {
    (async () => {
      await this.scheduleClusterTimezoneOffset();
      // await this.scheduleFileMonitoring();
      await this.scheduleEmailNotificationProcessing();
      await this.startJobMonitoring();
      await this.startIntermediateJobsMonitoring();
      await this.startJobPunctualityMonitoring();
      await this.startTimeSeriesAnalysisMonitoring();
      await this.checkClusterReachability();
      await this.checkClusterContainerization();
      await this.createMonitorCostJob();
      await this.createOrbitProfileMonitoringJob();
      await this.createDataArchiveJob();
      await removeUnverifiedUser.call(this);
      await sendPasswordExpiryEmails.call(this);
      await sendAccountDeleteEmails.call(this);
      await startLzFileMovementMonitoring.call(this);
      await startLzFileCountMonitoring.call(this);
      await startLzSpaceUsageMonitoring.call(this);
      await startClusterMonitoring.call(this);
      logger.info('-----------------------------');
      logger.info('Server is finished intializing, and is now running');
      logger.info('-----------------------------');
    })();
  }

  //Bree related methods
  logBreeJobs(): any {
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
  }: {
    uniqueJobName: string;
    cron?: string;
    jobfileName?: string;
    sprayedFileScope?: string;
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
  }): any {
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

  async removeJobFromScheduler(name: string): Promise<any> {
    return await removeJobFromScheduler.call(this, name);
  }

  async removeAllFromBree(): Promise<any> {
    return await removeAllFromBree.call(this);
  }

  getAllJobs(): any {
    return getAllJobs.call(this);
  }

  async stopJob(jobName: string): Promise<any> {
    return await stopJob.call(this, jobName);
  }

  async stopAllJobs(): Promise<any> {
    return await stopAllJobs.call(this);
  }

  startJob(jobName: string): any {
    return startJob.call(this, jobName);
  }

  startAllJobs(): any {
    return startAllJobs.call(this);
  }

  // Job that fetches workunit info
  createWuInfoFetchingJob(data: any): any {
    return createWuInfoFetchingJob.call(this, data);
  }

  createDataArchiveJob(): any {
    return createDataArchiveJob.call(this);
  }

  createMonitorCostJob(): any {
    return createMonitorCostJob.call(this);
  }

  createAnalyzeCostJob(): any {
    return createAnalyzeCostJob.call(this);
  }

  // Cluster jobs
  scheduleClusterTimezoneOffset(): any {
    return scheduleClusterTimezoneOffset.call(this);
  }

  startClusterMonitoring({
    clusterMonitoring_id,
    cron,
  }: {
    clusterMonitoring_id: string;
    cron: string;
  }): any {
    return startClusterMonitoring.call(this, {
      clusterMonitoring_id,
      cron,
    });
  }

  // file Monitoring
  createLandingZoneFileMonitoringBreeJob({
    filemonitoring_id,
    name,
    cron,
  }: {
    filemonitoring_id: string;
    name: string;
    cron: string;
  }): any {
    return createLandingZoneFileMonitoringBreeJob.call(this, {
      filemonitoring_id,
      name,
      cron,
    });
  }

  createLogicalFileMonitoringBreeJob({
    filemonitoring_id,
    name,
    cron,
  }: {
    filemonitoring_id: string;
    name: string;
    cron: string;
  }): any {
    return createLogicalFileMonitoringBreeJob.call(this, {
      filemonitoring_id,
      name,
      cron,
    });
  }

  scheduleFileMonitoringBreeJob({
    filemonitoring_id,
    name,
    cron,
    monitoringAssetType,
  }: {
    filemonitoring_id: string;
    name: string;
    cron: string;
    monitoringAssetType: string;
  }): any {
    return scheduleFileMonitoringBreeJob.call(this, {
      filemonitoring_id,
      name,
      cron,
      monitoringAssetType,
    });
  }

  // scheduleFileMonitoring(): any {
  //   return scheduleFileMonitoring.call(this);
  // }

  // Job monitoring
  startJobMonitoring(): any {
    return startJobMonitoring.call(this);
  }
  startIntermediateJobsMonitoring(): any {
    return startIntermediateJobsMonitoring.call(this);
  }

  startJobPunctualityMonitoring(): any {
    return startJobPunctualityMonitoring.call(this);
  }

  startTimeSeriesAnalysisMonitoring(): any {
    return startTimeSeriesAnalysisMonitoring.call(this);
  }

  //Process notification queue
  scheduleEmailNotificationProcessing(): any {
    return scheduleEmailNotificationProcessing.call(this);
  }

  // createOrbitMonitoringJob({ orbitMonitoring_id, cron }) {
  //   return createOrbitMonitoringJob.call(this, { orbitMonitoring_id, cron });
  // }

  createOrbitProfileMonitoringJob(): any {
    return createOrbitProfileMonitoringJob.call(this);
  }

  checkClusterReachability(): any {
    return checkClusterReachability.call(this);
  }

  checkClusterContainerization(): any {
    return checkClusterContainerization.call(this);
  }

  // User management jobs
  removeUnverifiedUser(): any {
    return removeUnverifiedUser.call(this);
  }

  // Landing Zone Monitoring
  startLzFileMovementMonitoring(): any {
    return startLzFileMovementMonitoring.call(this);
  }

  startLzFileCountMonitoring(): any {
    return startLzFileCountMonitoring.call(this);
  }

  startLzSpaceUsageMonitoring(): any {
    return startLzSpaceUsageMonitoring.call(this);
  }
}

export default new JobScheduler();
