const Bree = require('bree');
const models = require('./models');
var path = require('path');
const Job = models.job;
const JobExecution = models.job_execution;
const DependentJobs = models.dependent_jobs;
const MessageBasedJobs = models.message_based_jobs;
const hpccUtil = require('./utils/hpcc-util');
const assetUtil = require('./utils/assets.js');
const workflowUtil = require('./utils/workflow-util.js');
const SUBMIT_JOB_FILE_NAME = 'submitJob.js';
const SUBMIT_SPRAY_JOB_FILE_NAME = 'submitSprayJob.js'
const SUBMIT_SCRIPT_JOB_FILE_NAME = 'submitScriptJob.js';
const SUBMIT_MANUAL_JOB_FILE_NAME = 'submitManualJob.js'
const SUBMIT_GITHUB_JOB_FILE_NAME = 'submitGithubJob.js'
const JOB_STATUS_POLLER = 'statusPoller.js';

class JobScheduler {
  constructor() {
    this.bree = new Bree({
          root: false,
          errorHandler: (error, workerMetadata) => {
          if (workerMetadata.threadId) {
            console.log(`There was an error while running a worker ${workerMetadata.name} with thread ID: ${workerMetadata.threadId}`)
          } else {
            console.log(`There was an error while running a worker ${workerMetadata.name}`)
          }
        
          console.error(error);
          //errorService.captureException(error);
        },

        workerMessageHandler: async (worker) => {
          if (worker.message === 'done'){
            console.log(`Worker for job '${worker.name}' signaled 'done'`)
          }
          if(worker.message.action === 'logging'){
            console.log(`${worker.name}`);
            console.log('------------------------------------------');
            console.dir(worker.message.data);
            console.log('------------------------------------------');
          } 
          if(worker.message.action === 'remove'){
            this.bree.remove(worker.name);
            console.log('------------------------------------------');
            console.log('👷 JOB REMOVED', worker.name);
            console.log('------------------------------------------');
          } 
          if(worker.message.action === 'scheduleDependentJobs'){
           await this.scheduleCheckForJobsWithSingleDependency({...worker.message.data})
          } 
        }
      });
  }

  bootstrap() {
    (async()=>{
      console.log('------------------------------------------');
      console.log('✔️ JOBSCHEDULER IS BOOTSTRAPED, job-scheduler.js: class JobScheduler ')
      console.log('------------------------------------------');
      await this.scheduleActiveCronJobs();
      await this.scheduleJobStatusPolling();
    })()
  }
  

  async scheduleCheckForJobsWithSingleDependency({ dependsOnJobId , dataflowId }) {
      try {
        const dependantJobs  = await DependentJobs.findAll({where:{ dependsOnJobId, dataflowId }})
        console.log('------------------------------------------');
        console.log(`✔️  FOUND ${dependantJobs.length} DEPENDENT JOB/S` );
        console.log('------------------------------------------');

        const failedJobsList =[];

        for (let i = 0; i < dependantJobs.length; i++) {
        
        let job;  
        try { 
          const dependantJob = dependantJobs[i]; 
          job = await Job.findOne({where:{ id: dependantJob.jobId }});

          let status;  
          const isSprayJob = job.jobType == 'Spray';
          const isScriptJob = job.jobType == 'Script';
          const isManualJob = job.jobType === 'Manual';
          const isGitHubJob = job.metaData?.isStoredOnGithub;

          console.log('------------------------------------------');
          console.log(`🔄  scheduleCheckForJobsWithSingleDependency: EXECUTING DEPENDANT JOB "${job.name}" id:${job.id}; dflow: ${dataflowId};`);
          console.log('------------------------------------------');
     
          const commonWorkerData = { 
            applicationId: job.application_id,
            clusterId: job.cluster_id,
            dataflowId: dataflowId,
            jobName: job.name,
            jobId: job.id,
          };
            
          if (isSprayJob) {
            status = this.executeJob({ jobfileName: SUBMIT_SPRAY_JOB_FILE_NAME, ...commonWorkerData, sprayedFileScope: job.sprayedFileScope, sprayFileName: job.sprayFileName, sprayDropZone: job.sprayDropZone });
          } else if (isScriptJob) {
            status = this.executeJob({ jobfileName: SUBMIT_SCRIPT_JOB_FILE_NAME, ...commonWorkerData });
          } else if (isManualJob){
            status = this.executeJob({ jobfileName: SUBMIT_MANUAL_JOB_FILE_NAME, ...commonWorkerData, contact: job.contact, status : 'wait', manualJob_meta : { jobType : 'Manual', jobName: job.name, notifiedTo : job.contact, notifiedOn : new Date().getTime() } });
          } else if (isGitHubJob) {
            status = this.executeJob({ jobfileName: SUBMIT_GITHUB_JOB_FILE_NAME, ...commonWorkerData,  metaData : job.metaData, });
          } else {
            status = this.executeJob({ jobfileName: SUBMIT_JOB_FILE_NAME, ...commonWorkerData });
          }
          if (!status.success) throw status
        } catch (error) {
          console.log(error); // failed to execute dependent job through bree. Should notify user.
          if (error.contact) failedJobs.push(error);
        }
      } // for loop ends.

      if (failedJobsList.length > 0) {
        const contact = failedJobsList[0].contact;
        const dataflowId =failedJobsList[0].dataflowId
        await workflowUtil.notifyDependentJobsFailure({contact, dataflowId, failedJobsList})
      }

      } catch (err) {
        console.log(err)
      }
  };

  async scheduleActiveCronJobs() {
    let promises=[];
    const query = `SELECT ad.id, ad.cron, j.name as name,j.title, j.jobType, j.sprayedFileScope, j.sprayFileName, j.sprayDropZone, j.metaData, ad.dataflowId, ad.assetId, d.application_id, c.id as clusterId, c.thor_host, c.thor_port,
      d.title as dataflowName
      FROM tombolo.assets_dataflows ad
      left join dataflow d on d.id = ad.dataflowId
      left join job j on j.id = ad.assetId
      left join cluster c on c.id = d.clusterId
      where ad.cron IS NOT NULL
      and ad.deletedAt IS NULL
      order by ad.updatedAt desc
      ;`;

    const jobs = await models.sequelize.query(query, {
      type: models.sequelize.QueryTypes.SELECT,
    });  

    for(const job of jobs) {           
      try {
        const isSprayJob = job.jobType == 'Spray';
        const isScriptJob = job.jobType == 'Script';
        const isManualJob = job.jobType === 'Manual';
        const isGitHubJob = job.metaData?.isStoredOnGithub;
        
        const workerData = { 
          applicationId: job.application_id,
          clusterId: job.cluster_id,
          dataflowId: job.dataflowId,
          jobType:job.jobType,
          jobName: job.name,
          cron:  job.cron, 
          jobId: job.id,
        };

        workerData.jobfileName = SUBMIT_JOB_FILE_NAME;
        
        if (isScriptJob) jobfileName= SUBMIT_SCRIPT_JOB_FILE_NAME;
        if (isSprayJob){
          workerData.jobfileName= SUBMIT_SPRAY_JOB_FILE_NAME;
          workerData.sprayedFileScope= job.sprayedFileScope;
          workerData.sprayFileName=  job.sprayFileName;
          workerData.sprayDropZone=  job.sprayDropZone;
        }
        if (isManualJob){
          workerData.manualJob_meta= { jobType : 'Manual', jobName: job.name, notifiedTo : job.contact, notifiedOn : new Date().getTime() }; //? maybe needs to be refactored
          workerData.jobfileName= SUBMIT_MANUAL_JOB_FILE_NAME;
          workerData.contact= job.contact;
          workerData.status= 'wait';
        }
        if (isGitHubJob) {
          workerData.jobfileName= SUBMIT_GITHUB_JOB_FILE_NAME;
          workerData.metaData= job.metaData;
        }
        //finally add the job to the scheduler
        this.addJobToScheduler(workerData);
      } catch (err) {
        console.log(err);
      }
    } // loop ended.
    console.log('------------------------------------------');
    console.log(`📢 LIST OF ALL SCHEDULED JOBS IN BREE (${this.bree.config.jobs.length}) (may not include dependent jobs):`)
    console.dir(this.bree.config.jobs,{depth:4});
    console.log('------------------------------------------');
  }

  async scheduleMessageBasedJobs(message) {
    try {
      let job = await Job.findOne({where: {name: message.jobName}, attributes: {exclude: ['assetId']}});
      if(job) {
        let messageBasedJobs = await MessageBasedJobs.findAll({where: {jobId: job.id}});
        for(const messageBasedjob of messageBasedJobs) {
        this.executeJob({ 
            jobId: job.id,
            jobName: job.name,
            clusterId: job.cluster_id,
            dataflowId: messageBasedjob.dataflowId,
            applicationId: messageBasedjob.applicationId, 
            jobfileName: job.jobType == 'Script' ? SUBMIT_SCRIPT_JOB_FILE_NAME : SUBMIT_JOB_FILE_NAME,
            jobType: job.jobType,
            sprayedFileScope: job.sprayedFileScope,
            sprayFileName: job.sprayFileName,
            sprayDropZone: job.sprayDropZone,
          });
        }
      } else {
        console.log('------------------------------------------');
        console.error("📢 COULD NOT FIND JOB WITH NAME "+  message.jobName);
        console.log('------------------------------------------');
      }
    } catch (err) {
      console.log(err);
    }
  }

 addJobToScheduler({ cron, jobfileName, sprayedFileScope, manualJob_meta, sprayFileName, sprayDropZone, applicationId, dataflowId, clusterId, metaData, jobName, contact, jobType, status, jobId, title}) {
  try {
        let uniqueJobName = jobName + '-' + dataflowId + '-' + jobId;
        this.createNewBreeJob({uniqueJobName, cron, jobfileName, sprayedFileScope, manualJob_meta, sprayFileName, sprayDropZone, applicationId, dataflowId, clusterId, metaData, jobName, contact, jobType, status, jobId, title});
        this.bree.start(uniqueJobName);
        console.log('------------------------------------------');
        console.log(`📢 JOB WAS SCHEDULED AS - ${uniqueJobName},  job-scheduler.js: addJobToScheduler`)
        console.log(`📢 TOTAL SCHEDULED JOBS IN BREE (may not include dependent jobs): ${this.bree.config.jobs.length}`)
        console.log('------------------------------------------');
      } catch (err) {
        console.log(err);
      }
    }

 executeJob({ jobfileName, sprayedFileScope, manualJob_meta, sprayFileName, sprayDropZone, applicationId, dataflowId, clusterId, metaData, jobName, contact, jobType, status, jobId, title }) {
    try {
      let uniqueJobName = jobName + '-' + dataflowId + '-' + jobId; // TODO WILL HAVE TO BE A UNIQUE NAME
      this.createNewBreeJob({uniqueJobName, jobfileName, sprayedFileScope, manualJob_meta, sprayFileName, sprayDropZone, applicationId, dataflowId, clusterId, metaData, jobName, contact, jobType, status, jobId, title });
      this.bree.start(uniqueJobName);
      console.log('------------------------------------------');
      console.log(`✔️  BREE HAS STARTED JOB: "${uniqueJobName}"`)
      console.dir(this.bree.config.jobs, { depth: 3 });
      console.log('------------------------------------------');
      return {success : true, message : `Successfully executed ${jobName}`} 
    } catch (err) {
      console.log(err);
      return { success : false, message : `Error executing  ${jobName} - ${err.message}`, clusterId, dataflowId, contact, jobName, }
    }
  }

  createNewBreeJob({ uniqueJobName, cron, jobfileName, sprayedFileScope, manualJob_meta, sprayFileName, sprayDropZone, applicationId, dataflowId, clusterId, metaData, jobName, contact, jobType, status, jobId, title}){
    const job ={
      name: uniqueJobName,
      path: path.join(__dirname, 'jobs', jobfileName),
      worker: {
        workerData: { sprayedFileScope, manualJob_meta, sprayFileName, sprayDropZone, applicationId, dataflowId, clusterId, metaData, jobName, contact, jobType, status, jobId, title, }
      }
    }
    if (cron){
      job.cron = cron;
      job.worker.workerData.isCronJob=true;
    }else{
      job.timeout= 0;
      job.worker.workerData.isCronJob=false;
    }
    this.bree.add(job)
  }

 async removeJobFromScheduler(name) {
      try {
        const existingJob = this.bree.config.jobs.find(job=> job.name === name);    
        if (existingJob){
         await this.bree.remove(name);
        }
      } catch (err) {
        console.log(err)
      }
    }
    
    async scheduleJobStatusPolling() {    
    console.log("📢 STATUS POLLING SCHEDULER STARTED...");
    try {
      let jobName = 'job-status-poller-'+new Date().getTime();
      //if(job) {
        this.bree.add({
          name: jobName,
          interval: '20s',
          path: path.join(__dirname, 'jobs', JOB_STATUS_POLLER),
          worker: {
            workerData: {
              jobName: jobName
            }
          }
        })

        this.bree.start(jobName);  
      //}
  
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = new JobScheduler();