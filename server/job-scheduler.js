const Bree = require('bree');
const models = require('./models');
var path = require('path');
let Job = models.job;
const JobExecution = models.job_execution;
const hpccUtil = require('./utils/hpcc-util');
const assetUtil = require('./utils/assets.js');
const workflowUtil = require('./utils/workflow-util.js');
let MessageBasedJobs = models.message_based_jobs;
const SUBMIT_JOB_FILE_NAME = 'submitJob.js';
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
  

   // TODO PASS DATAFLOW!
   async scheduleCheckForJobsWithSingleDependency(jobName) {
    return new Promise(async (resolve, reject) => {    
      try {
        const query = `SELECT j1.id, j1.name, j1.contact, j1.jobType, j1.sprayedFileScope, j1.sprayFileName, j1.sprayDropZone, dj.dependsOnJobId as dependsOnJobId, dj.jobId, c.id as clusterId, d.id as dataflowId, d.application_id, count(*) as count
          FROM tombolo.dependent_jobs dj
          left join job j1 on j1.id = dj.jobId
          left join job j2 on j2.id = dj.dependsOnJobId
          left join dataflow d on d.id = dj.dataflowId
          left join cluster c on c.id = d.clusterId
          where j2.name=(:jobName)
          and j1.deletedAt is null
          and j2.deletedAt is null
          and dj.deletedAt is null
          group by dj.jobId
          having count = 1
          order by d.updatedAt desc
          ;`;

        let replacements = { jobName: jobName};
        const jobs = await models.sequelize.query(query, {
          type: models.sequelize.QueryTypes.SELECT,
          replacements: replacements
        });

        console.log('------------------------------------------');
        console.log(`✔️  job-scheduler.js: FOUND ${jobs.length} DEPENDENT JOB/S` );
        console.log('------------------------------------------');

        for(const job of jobs) {
          // If the dependent job is a manual job
          if(job.jobType === "Manual"){
            // this.executeJob(job);
	          job.url = `${process.env.WEB_URL}${job.application_id}/manualJobDetails/${job.id}`
            job.applicationId = job.application_id;
            job.status = 'wait';
            job.manualJob_meta = {jobName: job.name, notifiedTo : job.contact, notifiedOn : new Date().getTime()}
            await JobExecution.create(job)
            await  workflowUtil.notifyManualJob(job);
          }else{
             //submit the dependant job's wu and record the execution in job_execution table for the statusPoller to pick
          let wuDetails = await hpccUtil.getJobWuDetails(job.clusterId, job.name);      
          let wuid = wuDetails.wuid;
          console.log(
            `submitting dependant job ${job.name} ` +
            `(WU: ${wuid}) to url ${job.clusterId}/WsWorkunits/WUResubmit.json?ver_=1.78`
            );
          let wuResubmitResult = await hpccUtil.resubmitWU(job.clusterId, wuid, wuDetails.cluster);    
          let jobExecutionData = {
            name: job.name, 
            clusterId: job.clusterId, 
            dataflowId: job.dataflowId, 
            applicationId: job.application_id, 
            jobId: job.id, 
            jobType: job.jobType == 'Script' ? SUBMIT_SCRIPT_JOB_FILE_NAME : SUBMIT_JOB_FILE_NAME,
            sprayedFileScope: job.sprayedFileScope,
            sprayFileName: job.sprayFileName,
            sprayDropZone: job.sprayDropZone,
            status: 'submitted'
          }
          assetUtil.recordJobExecution(jobExecutionData, wuResubmitResult?.WURunResponse.Wuid)
          }
        }
        resolve();
      } catch (err) {
        console.log(err)
        reject(err)
      }
    });
  }

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
        await this.addJobToScheduler({
           name:  job.name, 
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
       console.log("📢 LIST OF ALL ACTIVE JOBS SCHEDULED:")
       console.dir(this.bree.config.jobs,{depth:4});
       console.log('------------------------------------------');
  }

  async scheduleMessageBasedJobs(message) {
    try {
      let job = await Job.findOne({where: {name: message.jobName}, attributes: {exclude: ['assetId']}});
      if(job) {
        let messageBasedJobs = await MessageBasedJobs.findAll({where: {jobId: job.id}});
        for(const messageBasedjob of messageBasedJobs) {
          await this.executeJob(
            job.name,
            job.cluster_id,
            messageBasedjob.dataflowId,
            messageBasedjob.applicationId,
            job.id,
            job.jobType == 'Script' ? SUBMIT_SCRIPT_JOB_FILE_NAME : SUBMIT_JOB_FILE_NAME,
            job.jobType,
            job.sprayedFileScope,
            job.sprayFileName,
            job.sprayDropZone
            );
        }
      } else {
        console.log('------------------------------------------');
        console.error("📢 COULD NOT FIND JOB WITH NAME "+message.jobName);
        console.log('------------------------------------------');
      }
    } catch (err) {
      console.log(err);
    }
  }

  async addJobToScheduler({name, cron, clusterId, dataflowId, applicationId, jobId, jobfileName, jobType, sprayedFileScope, sprayFileName, sprayDropZone, metaData, title, contact}) {
    try {
      let uniqueJobName = name + '-' + dataflowId + '-' + jobId;
      this.bree.add({
        name: uniqueJobName,
        cron: cron,
        path: path.join(__dirname, 'jobs', jobfileName),
        worker: {
          workerData: {
            jobName: name,
            clusterId: clusterId,
            jobId: jobId,
            applicationId: applicationId,
            dataflowId: dataflowId,
            jobType: jobType,
            title: title,
            contact : contact,
            sprayedFileScope: sprayedFileScope,
            sprayFileName: sprayFileName,
            sprayDropZone: sprayDropZone,
            metaData: metaData
          }
        }
      })

      this.bree.start(uniqueJobName);
      console.log('------------------------------------------');
      console.log(`📢 JOB WAS SCHEDULED AS - ${uniqueJobName},  job-scheduler.js: addJobToScheduler`)
      console.log(`📢 TOTAL ACTIVE JOBS: ${this.bree.config.jobs.length}`)
      console.log('------------------------------------------');
    } catch (err) {
      console.log(err);
    }
  }

  // async executeJob(name, clusterId, dataflowId, applicationId, jobId, jobfileName, jobType, sprayedFileScope, sprayFileName, sprayDropZone) {
    async executeJob(job) {
    try {
      let uniqueJobName = job.name + '-' + job.dataflowId + '-' + job.id;
      //TDO - first check before trying to remoe from the queue. It is throwing err if the job is not there
      // await this.removeJobFromScheduler(uniqueJobName);
      this.bree.add({
        name: uniqueJobName,
        timeout: 0,
        path: path.join(__dirname, 'jobs', "submitManualJob.js"),
        worker: {
          workerData: {
            jobName: job.name,
            contact: job.contact,
            clusterId: job.clusterId,
            jobId: job.id,
            dataflowId: job.dataflowId,
            applicationId: job.application_id,
            status : 'wait',
            manualJob_meta : {jobType : 'Manual', jobName: job.name, notifiedTo : job.contact, notifiedOn : new Date().getTime()}
          }
        }
      })

      this.bree.start(uniqueJobName);
      return {success : true, message : `Successfully executed ${job.name}`}
    } catch (err) {
      console.log(err);
      return {success : false, message : `Error executing  ${job.name} - ${err}`}
    }
  }

  async removeJobFromScheduler(name) {
    try {
      await this.bree.remove(name);
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