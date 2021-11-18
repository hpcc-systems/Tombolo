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
  

  async scheduleCheckForJobsWithSingleDependency({ dependsOnJobId , dataflowId }) {
    return new Promise(async (resolve, reject) => {    
      try {
        const dependantJobs  = await DependentJobs.findAll({where:{ dependsOnJobId, dataflowId }})
        console.log('------------------------------------------');
        console.log(`✔️  job-scheduler.js: FOUND ${dependantJobs.length} DEPENDENT JOB/S` );
        console.log('------------------------------------------');

        for (let i = 0; i < dependantJobs.length; i++) {
          const dependantJob = dependantJobs[i]; 
          const job = await Job.findOne({where:{ id: dependantJob.jobId }});

          console.log('------------------------------------------');
          console.log(`🔄 scheduleCheckForJobsWithSingleDependency: EXECUTING DEPENDANT JOB "${job.name}" id:${job.id}; dflow: ${dataflowId};`);
          console.log('------------------------------------------');
          //------------------------------------------
          // GITHUB FLOW
          if (job.metaData?.isStoredOnGithub){
            // TODO SWITCH FLOW TO USE EXECUTEJOB METHOD
            // this.executeJob({ //   name: job.name, //   clusterId: job.cluster_id, //   dataflowId, //   applicationId: job.application_id, //   jobId: job.id, //   jobfileName: SUBMIT_JOB_FILE_NAME, //   jobType:job.type, //   sprayedFileScope:job.sprayedFileScope, //   sprayFileName:job.sprayFileName, //   sprayDropZone:job.sprayDropZone, //   metaData:job.metaData // });
            console.log('------------------------------------------');
            console.log(`✔️ scheduleCheckForJobsWithSingleDependency: CREATING GITHUB FLOW FOR DEPENDENT JOB ${job.name} id:${job.id}; dflow: ${dataflowId};`);
            console.log('------------------------------------------');
            const flowSettings ={ gitHubFiles : job.metaData.gitHubFiles, applicationId: job.application_id, clusterId: job.cluster_id, jobName : job.name, jobId: job.id, dataflowId: dataflowId };
            const summary = await assetUtil.createGithubFlow(flowSettings);
            console.log('------------------------------------------');
            console.log(`✔️  scheduleCheckForJobsWithSingleDependency: SUBMITTED DEPENDENT JOB ${job.name} id:${job.id}; dflow: ${dataflowId}, SUMMARY!`);
            console.dir(summary, { depth: null });
            console.log('------------------------------------------');
          } 
          //------------------------------------------
          // MANUAL FLOW
          if(job.jobType === "Manual"){
            // this.executeJob(job);
            const newJobExecution ={
              status:'wait',
              jobId:job.id,
              dataflowId:job.dataflowId,
              clusterId: job.cluster_id,
              applicationId: job.application_id,
              url: `${process.env.WEB_URL}${job.application_id}/manualJobDetails/${job.id}`,
              manualJob_meta : {jobName: job.name, notifiedTo : job.contact, notifiedOn : new Date().getTime()}
            }

            console.log('job ------------------------------------------');
            console.dir(job, { depth: 1 });
            console.log('------------------------------------------');
            
            await JobExecution.create(newJobExecution)
            await  workflowUtil.notifyManualJob({contact:job.contact, url: newJobExecution.url});
          }
          //------------------------------------------
          // REGULAR FLOW
          else{  
          //submit the dependant job's wu and record the execution in job_execution table for the statusPoller to pick
          let wuDetails = await hpccUtil.getJobWuDetails(job.cluster_id, job.name);      
          let wuid = wuDetails.wuid;
          console.log('------------------------------------------');
          console.log( `✔️ scheduleCheckForJobsWithSingleDependency: submitting dependant job ${job.name} ` + `(WU: ${wuid}) to url ${job.cluster_id}/WsWorkunits/WUResubmit.json?ver_=1.78` );
          console.log('------------------------------------------');
          let wuResubmitResult = await hpccUtil.resubmitWU(job.cluster_id, wuid, wuDetails.cluster);
          await JobExecution.update({status:'submitted', wuid : wuResubmitResult?.WURunResponse.Wuid },{ where:{ jobId:job.id }});
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
      console.log(`📢 TOTAL SCHEDULED JOBS IN BREE (may not include dependent jobs): ${this.bree.config.jobs.length}`)
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
  // TODO THIS METHOD IS MORE GENERIC BUT WE AGREED TO USE THE ONE ABOVE AS FOR NOW ONLY YADHAP's CODE IS USING THIS METHOD.
  // async executeJob({name, clusterId, dataflowId, applicationId, jobId, jobfileName, jobType, sprayedFileScope, sprayFileName, sprayDropZone, metaData}) {
  //   try {
  //     let uniqueJobName = job.name + '-' + job.dataflowId + '-' + job.id;
  //     //TDO - first check before trying to remoe from the queue. It is throwing err if the job is not there
  //     // await this.removeJobFromScheduler(uniqueJobName);
  //     this.bree.add({
  //       name: uniqueJobName,
  //       timeout: 0,
  //       path: path.join(__dirname, 'jobs', "submitManualJob.js"),
  //       worker: {
  //         workerData: {
  //           jobName: name,
  //           clusterId: clusterId,
  //           jobId: jobId,
  //           applicationId: applicationId,
  //           dataflowId: dataflowId,
  //           jobType: jobType,
  //           sprayedFileScope: sprayedFileScope,
  //           sprayFileName: sprayFileName,
  //           sprayDropZone: sprayDropZone,
  //           metaData: metaData
  //         }
  //       }
  //     })
  //     this.bree.start(uniqueJobName);
  //     console.log('------------------------------------------');
  //     console.log(`✔️  BREE HAS STARTED JOB: "${uniqueJobName}"`)
  //     console.log('------------------------------------------');
  //     console.log('------------------------------------------');
  //     console.dir(this.bree.config.jobs, { depth: 3 });
  //     console.log('------------------------------------------');
  //   } catch (err) {
  //     console.log(err);
  //     return {success : false, message : `Error executing  ${job.name} - ${err}`}
  //   }
  // }

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