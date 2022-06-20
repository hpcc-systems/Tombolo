const Bree = require('bree');
const models = require('./models');
var path = require('path');
const logger = require('./config/logger');

const Job = models.job;
const MessageBasedJobs = models.message_based_jobs;
const DataflowVersions = models.dataflow_versions;
const JobExecution = models.job_execution;

const { v4: uuidv4 } = require('uuid');
const workflowUtil = require('./utils/workflow-util.js');
const SUBMIT_JOB_FILE_NAME = 'submitJob.js';
const SUBMIT_QUERY_PUBLISH = 'submitPublishQuery.js'
const SUBMIT_SPRAY_JOB_FILE_NAME = 'submitSprayJob.js';
const SUBMIT_SCRIPT_JOB_FILE_NAME = 'submitScriptJob.js';
const SUBMIT_MANUAL_JOB_FILE_NAME = 'submitManualJob.js';
const SUBMIT_GITHUB_JOB_FILE_NAME = 'submitGithubJob.js';
const JOB_STATUS_POLLER = 'statusPoller.js';
const FILE_MONITORING = 'fileMonitoringPoller.js'

class JobScheduler {
  constructor() {
    this.bree = new Bree({
      root: false,
      logger: false,
      errorHandler: (error, workerMetadata) => {
        if (workerMetadata.threadId) {
          logger.error( `There was an error while running a worker ${workerMetadata.name} with thread ID: ${workerMetadata.threadId}`, error);
        } else {
          logger.error(`There was an error while running a worker ${workerMetadata.name}`, error);
        }
      },
      workerMessageHandler: async (worker) => {
        // message type is <any>, when worker exits message ='done' by default. 
        //To pass more props we use object {level?: info|verbose|error ; text?:any; error?: instanceof Error; action?: scheduleNext|remove; data?:any }
        const message = worker.message;
        let workerName = worker.name; 
        if(workerName.includes("job-status-poller")) workerName= "Status poller";
        if(workerName.includes("file-monitoring")) workerName= "File monitoring";
        
        if (message === 'done') {
          logger.verbose(`${workerName} signaled 'done'`);
        }
        if (message?.level === 'verbose') {
          logger.verbose(`[${workerName}]:`);
          logger.verbose(message.text);
        }
        if (message?.level === 'info') {
          logger.info(`[${workerName}]:`);
          logger.info(message.text);
        }    
        if (message?.level === 'error') {
          logger.error(`[${workerName}]:`)
          logger.error(`${message.text}`, message.error);
        }
        if (message?.action === 'remove') {
          this.bree.remove(worker.name);
          logger.info(`👷 JOB REMOVED:  ${workerName}`);
        }
        if (message?.action == 'scheduleNext') {
          await this.scheduleCheckForJobsWithSingleDependency({ ...message.data });
        }
      },
    });
  }

  bootstrap() {
    (async () => {
      await this.scheduleActiveCronJobs();
      await this.scheduleJobStatusPolling();
      await this.scheduleFileMonitoring();
      logger.info('✔️ JOBSCHEDULER IS BOOTSTRAPED');
    })()
  }

  async scheduleCheckForJobsWithSingleDependency({ dependsOnJobId, dataflowId, jobExecutionGroupId }) {
    try {
      const dataflowVersion = await DataflowVersions.findOne({ where: { dataflowId: dataflowId, isLive : true }, attributes: ["graph"] });
      if (!dataflowVersion) throw new Error('Dataflow does not exist');

      let dependantJobs = dataflowVersion.graph.cells.reduce((acc, cell) => {
        if (cell?.data?.schedule?.dependsOn?.includes(dependsOnJobId))
          acc.push({ jobId: cell.data.assetId });
        return acc;
      }, []);

      if (dependantJobs.length === 0 && dataflowId) {
        try {
          logger.info('WORKFLOW EXECUTION COMPLETE, Checking if subscribed for notifications.');
          await workflowUtil.notifyWorkflow({dataflowId, jobExecutionGroupId, status: 'completed'})
        } catch (error) {
          logger.error('WORKFLOW EXECUTION COMPLETE NOTIFICATION FAILED', error);
        }
      } else {
        logger.verbose(`✔️  FOUND ${dependantJobs.length} DEPENDENT JOB/S`);
        //List of dependent job ids
        let dependentJobsIds = dependantJobs.map(job => job.jobId);
        //Check if any of the dependent job are already in submitted state
        const alreadySubmitted = await JobExecution.findAll({where : {dataflowId: dataflowId, jobId : dependentJobsIds, status : 'submitted'} , attributes: ['jobId'], raw : true});
        //Remove already submitted jobs from dependent jobs array
        dependantJobs = dependantJobs.filter(job => !alreadySubmitted.find(submittedJob => (submittedJob.jobId === job.jobId)))

        for (const dependentJob of dependantJobs) {
          try {
            let job = await Job.findOne({ where: { id:dependentJob.jobId } });
            let status;
            const isSprayJob = job.jobType == 'Spray';
            const isScriptJob = job.jobType == 'Script';
            const isManualJob = job.jobType === 'Manual';
            const isQueryPublishJob= job.jobType === 'Query Publish';

            const isGitHubJob = job.metaData?.isStoredOnGithub;

            logger.info( `🔄 EXECUTING DEPENDANT JOB "${job.name}" id:${job.id}; dflow: ${dataflowId};` );

            const commonWorkerData = {
              applicationId: job.application_id,
              clusterId: job.cluster_id,
              dataflowId: dataflowId,
              jobExecutionGroupId,
              jobType: job.jobType,
              jobName: job.name,
              title: job.title,
              jobId: job.id,
            };

            if (isSprayJob) {
              status = this.executeJob({ ...commonWorkerData, sprayFileName: job.sprayFileName, sprayDropZone: job.sprayDropZone, sprayedFileScope: job.sprayedFileScope, jobfileName: SUBMIT_SPRAY_JOB_FILE_NAME, });
            } else if (isScriptJob) {
              status = this.executeJob({ jobfileName: SUBMIT_SCRIPT_JOB_FILE_NAME, ...commonWorkerData });
            } else if (isManualJob) {
              status = this.executeJob({ ...commonWorkerData, status: 'wait', jobfileName: SUBMIT_MANUAL_JOB_FILE_NAME, manualJob_meta: { jobType: 'Manual', jobName: job.name, notifiedTo: job.contact }, });
            } else if (isGitHubJob) {
              status = this.executeJob({ ...commonWorkerData, metaData: job.metaData, jobfileName: SUBMIT_GITHUB_JOB_FILE_NAME, });
            } else if (isQueryPublishJob) {
              status = this.executeJob({ jobfileName: SUBMIT_QUERY_PUBLISH, ...commonWorkerData});
            } else {
              status = this.executeJob({ jobfileName: SUBMIT_JOB_FILE_NAME, ...commonWorkerData });
            }
            if (!status.success) throw status;
          } catch (error) {
            // failed to execute dependent job through bree. User will be notified inside worker
            logger.error('Failed to execute dependent job through bree', error); 
          }   
        }
      }
    } catch (error) {
      logger.error(error);
      const message=`Error happened while trying to execute workflow, try to 'Save version' and execute it again. | Error: ${error.message} `
      await workflowUtil.notifyWorkflow({dataflowId, jobExecutionGroupId, status: 'error', exceptions: message})
    }
  }

  executeJob(jobData) {
    try {
      let uniqueJobName = jobData.jobName + '-' + jobData.dataflowId + '-' + jobData.jobId + '-' + uuidv4();
      this.createNewBreeJob({...jobData, uniqueJobName});
      this.bree.start(uniqueJobName);
      logger.info(`✔️  BREE HAS STARTED JOB: "${uniqueJobName}"`);
      this.logBreeJobs();
      return { success: true, message: `Successfully executed ${jobData.jobName}` };
    } catch (err) {
     logger.error(err);
      return {
        success: false,
        contact:jobData.contact,
        jobName:jobData.jobName,
        clusterId: jobData.clusterId,
        dataflowId: jobData.dataflowId,
        message: `Error executing  ${jobName} - ${err.message}`,
      };
    }
  }

  async scheduleActiveCronJobs() {
    try {
      // get all graphs active graphs
      const dataflowsVersions = await DataflowVersions.findAll({ where:{ isLive: true }, attributes: ['graph', 'dataflowId'] });

      for (const dataflowsVersion of dataflowsVersions) {
        const cronScheduledNodes = dataflowsVersion.graph?.cells?.filter((cell) => cell.data?.schedule?.cron) || [];
        if (cronScheduledNodes.length > 0) {
          for (const node of cronScheduledNodes) {
            try {
              const job = await Job.findOne({ where: { id: node.data.assetId } });
              if (!job) throw new Error(`Failed to schedule job ${job.name}`);

              const isSprayJob = job.jobType == 'Spray';
              const isScriptJob = job.jobType == 'Script';
              const isManualJob = job.jobType === 'Manual';
              const isGitHubJob = job.metaData?.isStoredOnGithub;

              const workerData = {
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

              if (isScriptJob) jobfileName = SUBMIT_SCRIPT_JOB_FILE_NAME;
              if (isSprayJob) {
                workerData.jobfileName = SUBMIT_SPRAY_JOB_FILE_NAME;
                workerData.sprayedFileScope = job.sprayedFileScope;
                workerData.sprayFileName = job.sprayFileName;
                workerData.sprayDropZone = job.sprayDropZone;
              }
              if (isManualJob) {
                workerData.manualJob_meta = {
                  jobType: 'Manual',
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
              //finally add the job to the scheduler
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
    logger.verbose(`📢 ACTIVE CRON JOBS (${this.bree.config.jobs.length}) (does not include dependent jobs):`);
    this.logBreeJobs();
  }

  async scheduleMessageBasedJobs(message) {
    try {
      let job = await Job.findOne({ where: { name: message.jobName }, attributes: { exclude: ['assetId'] } });
      if (job) {
        let messageBasedJobs = await MessageBasedJobs.findAll({ where: { jobId: job.id } });
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
            jobfileName: job.jobType == 'Script' ? SUBMIT_SCRIPT_JOB_FILE_NAME : SUBMIT_JOB_FILE_NAME,
          });
        }
      } else {
        logger.warn('📢 COULD NOT FIND JOB WITH NAME ' + message.jobName);
      }
    } catch (err) {
      logger.error(err)
    }
  }

  addJobToScheduler({  skipLog = false, ...jobData }) {
    try {
      let uniqueJobName = jobData.jobName + '-' + jobData.dataflowId + '-' + jobData.jobId;
      this.createNewBreeJob({ uniqueJobName, ...jobData });
      this.bree.start(uniqueJobName);
      
      logger.info(`📢 JOB WAS SCHEDULED AS - ${uniqueJobName},  job-scheduler.js: addJobToScheduler`);
      !skipLog && this.logBreeJobs();
      
      return {success: true}
    } catch (err) {
      logger.error(err);
      const part2 = err.message.split(' an ')?.[1]  // error message is not user friendly, we will trim it to have everything after "an".
      if (part2) err.message = part2;
      return {success: false, error: err.message }
    }
  }

  createNewBreeJob({ uniqueJobName, cron, jobfileName, sprayedFileScope, manualJob_meta, sprayFileName, sprayDropZone, applicationId, dataflowId, clusterId, metaData, jobName, contact, jobType, status, jobId, title, jobExecutionGroupId }) {
    const job = {
      name: uniqueJobName,
      path: path.join(__dirname, 'jobs', jobfileName),
      worker: {
        workerData: {
          WORKER_CREATED_AT: Date.now(),
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

  async removeJobFromScheduler(name) {
    try {
       const existingJob = this.bree.config.jobs.find(job=> job.name === name);
      if (existingJob) {
        await this.bree.remove(name);
        logger.info(`📢 -Job removed from Bree ${existingJob.name}`);
        return {success:true, job: existingJob, jobs: this.bree.config.jobs }
      }
    } catch (err) {
      logger.error(err);
      return {success:false, message:err.message, jobs: this.bree.config.jobs }
    }
  }

  async removeAllFromBree(namePart) {
    try {
      const existingJobs = this.bree.config.jobs.filter((job) => job.name.includes(namePart));
      if (existingJobs.length > 0) {
        for (const job of existingJobs) {
          try {
            await this.bree.remove(job.name);
            logger.info(`📢 -Job removed from Bree ${job.name}`);
          } catch (error) {
            logger.error(error);
          }
        }
      }
    } catch (err) {
      logger.error(err);
    }
  }
  
  async scheduleJobStatusPolling() {
    logger.info('📢 STATUS POLLING SCHEDULER STARTED...');
    
    try {
      let jobName = 'job-status-poller-' + new Date().getTime();
      
      this.bree.add({
        name: jobName,
        interval: '20s',
        path: path.join(__dirname, 'jobs', JOB_STATUS_POLLER),
        worker: {
          workerData: {
            jobName: jobName,
            WORKER_CREATED_AT: Date.now()
          },
        },
      });

      this.bree.start(jobName);
    } catch (err) {
      logger.error(err);
    }
  }

  // FILE MONITORING POLLER
  async scheduleFileMonitoring() {
    logger.info('📂 FILE MONITORING STARTED ...');
    try { 
      let jobName = 'file-monitoring-' + new Date().getTime();
        this.bree.add({
          name: jobName,
          interval: '500s',
          path: path.join(__dirname, 'jobs', FILE_MONITORING),
          worker: {
            workerData: {
              jobName: jobName,
              WORKER_CREATED_AT: Date.now()
            }
          }
        })

        this.bree.start(jobName);    
    } catch (err) {
      logger.error(err);
    }
  }

  logBreeJobs() {
    if (process.env.NODE_ENV === 'production') return;//do not polute logs during production;
    const jobs = this.bree.config.jobs;
    logger.verbose('📢 Bree jobs:');
    for (const job of jobs) {
      if (job.name.includes('job-status-poller')) continue; // hide status poller from logs
      if (job.name.includes('file-monitoring')) continue;// hide file monitoring from logs
      logger.verbose({
        name: job.name,
        cron: job.cron,
        jobName: job.worker?.workerData?.jobName,
        dataflowId: job.worker?.workerData?.dataflowId,
        group: job.worker?.workerData?.jobExecutionGroupId,
      });
    }
  }

  getAllJobs(){
    return this.bree.config.jobs;
  };

 async stopJob(jobName){
    const job = this.bree.config.jobs.find(job => job.name === jobName);
    try{
    if (job){
      await this.bree.stop(jobName);
      return {success: true, job, jobs: this.bree.config.jobs };
    } else{
      return { success:false, message:"job is not found", jobs: this.bree.config.jobs }
    }
    } catch (err){
      return { success:false, message: err.message, jobs: this.bree.config.jobs }
    }
  };

  async stopAllJobs(){
    try{
      const allJobs = [...this.bree.config.jobs]
      await this.bree.stop();
      return {success: true, jobs: allJobs};
    }catch(err){
      return { success:false, message:err.message, jobs: this.bree.config.jobs }
    }
 };

  startJob(jobName){
    const job = this.bree.config.jobs.find(job => job.name === jobName);
    try{
      if (job) {
        this.bree.start(jobName);
        return {success: true, job, jobs: this.bree.config.jobs };
      } else{
        return { success:false, message:"job is not found", jobs: this.bree.config.jobs }
      }
    }catch(err){
     return { success:false, message:err.message, jobs: this.bree.config.jobs }
    }
  }

  startAllJobs(){
    try{
      const allJobs = [...this.bree.config.jobs]
      this.bree.start();
      return {success: true, jobs: allJobs};
    }catch(err){
      return { success:false, message:err.message, jobs: this.bree.config.jobs }
    }
 };
}

module.exports = new JobScheduler();
