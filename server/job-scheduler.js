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
const SUBMIT_GITHUB_JOB_FILE_NAME= 'submitGithubJob.js';
const SUBMIT_MANUAL_JOB_FILE_NAME = 'submitManualJob.js'
const SUBMIT_SCRIPT_JOB_FILE_NAME = 'submitScriptJob.js';
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

        for (let i = 0; i < dependantJobs.length; i++) {

          const dependantJob = dependantJobs[i]; 
          const job = await Job.findOne({where:{ id: dependantJob.jobId }});

          const gitHubJob = job.metaData?.isStoredOnGithub;
          const manualJob = job.jobType === "Manual";

          console.log('------------------------------------------');
          console.log(`🔄  scheduleCheckForJobsWithSingleDependency: EXECUTING DEPENDANT JOB "${job.name}" id:${job.id}; dflow: ${dataflowId};`);
          console.log('------------------------------------------');

          if (gitHubJob){
              // EXECUTING GITHUB FILE WITH ALL NEEDED DATA IN WORKERDATA OBJECT
           this.executeJob({
            applicationId: job.application_id,
            jobfileName: SUBMIT_GITHUB_JOB_FILE_NAME,
            clusterId: job.cluster_id,
            metaData:job.metaData,
            jobName: job.name,
            jobId: job.id,
            dataflowId,
            });

          } else if (manualJob){
            // EXECUTING MANUAL FILE WITH ALL NEEDED DATA IN WORKERDATA OBJECT
           this.executeJob({
            applicationId: job.application_id,
            jobfileName: SUBMIT_MANUAL_JOB_FILE_NAME,
            clusterId: job.cluster_id,
            metaData: job.metaData,
            contact: job.contact,
            jobName: job.name,
            jobId: job.id,
            status: 'wait',
            dataflowId,
            title: '', 
            manualJob_meta : {
              jobName: job.name,
              notifiedTo : job.contact,
              notifiedOn : new Date().getTime()
            }});

          } else {
            // REGULAR FLOW
            //submit the dependant job's wu and record the execution in job_execution table for the statusPoller to pick
            let wuDetails = await hpccUtil.getJobWuDetails(job.cluster_id, job.name);      
            let wuid = wuDetails.wuid;
            console.log( `✔️  scheduleCheckForJobsWithSingleDependency: submitting dependant job ${job.name} ` + `(WU: ${wuid}) to url ${job.cluster_id}/WsWorkunits/WUResubmit.json?ver_=1.78` );
            let wuResubmitResult = await hpccUtil.resubmitWU(job.cluster_id, wuid, wuDetails.cluster);
            const newJobExecution = { status:'submitted', wuid : wuResubmitResult?.WURunResponse.Wuid, jobId: job.id, clusterId: job.cluster_id, dataflowId, applicationId: job.application_id }
            await JobExecution.create(newJobExecution);
          }
        } // for loop ends.
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
        //finally add the job to the scheduler
     this.addJobToScheduler({
           jobName: job.name, 
           cron:  job.cron, 
           clusterId:  job.clusterId,
           dataflowId:job.dataflowId,
           applicationId:job.application_id,
           jobId: job.assetId,
           jobfileName: job.jobType == 'Script' ? SUBMIT_SCRIPT_JOB_FILE_NAME : SUBMIT_JOB_FILE_NAME,
           jobType:job.jobType,
           sprayedFileScope:job.sprayedFileScope,
           sprayFileName: job.sprayFileName,
           sprayDropZone: job.sprayDropZone,
           metaData: job.metaData
          });
      } catch (err) {
        console.log(err);
      }
     } 
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
      return {success : true, message : `Successfully executed ${jobName}`} //?? check if this is necessary 
    } catch (err) {
      console.log(err);
      return {success : false, message : `Error executing  ${jobName} - ${err}`}
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

   removeJobFromScheduler(name) {
    try {
    const existingJob = this.bree.config.jobs.find(job=> job.name === name);
      if (existingJob){
        this.bree.remove(name);
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