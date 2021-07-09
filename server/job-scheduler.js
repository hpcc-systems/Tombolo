const Bree = require('bree');
const models = require('./models');
const request = require('request-promise');
const hpccUtil = require('./utils/hpcc-util');
var path = require('path');
let Job = models.job;
let MessageBasedJobs = models.message_based_jobs;
const SUBMIT_JOB_FILE_NAME = 'submitJob.js';
const SUBMIT_SCRIPT_JOB_FILE_NAME = 'submitScriptJob.js';

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
    (async () => {
      await this.bootstrap();
      //this.bree.start();
    })();
  }

  async bootstrap() {
    await this.scheduleActiveCronJobs();
  }

  async scheduleCheckForJobsWithSingleDependency(jobName) {
    const query = `SELECT j1.id, j1.name, j1.jobType, j1.sprayedFileScope, j1.sprayFileName, j1.sprayDropZone, dj.dependsOnJobId as dependsOnJobId, dj.jobId, c.id as clusterId, d.id as dataflowId, d.application_id, count(*) as count
      FROM tombolo.dependent_jobs dj
      left join job j1 on j1.id = dj.jobId
      left join job j2 on j2.id = dj.dependsOnJobId
      left join dataflow d on d.id = dj.dataflowId
      left join cluster c on c.id = d.clusterId
      where j2.name=(:jobName)
      group by dj.jobId
      having count = 1
      order by d.updatedAt desc
      ;`;

    let replacements = { jobName: jobName};
    const jobs = await models.sequelize.query(query, {
      type: models.sequelize.QueryTypes.SELECT,
      replacements: replacements
    });

    //jobs.forEach(async job => {
    for(const job of jobs) {
      //this.bree.add({ });
      try {
        await this.executeJob(
          job.name, 
          job.clusterId, 
          job.dataflowId, 
          job.application_id, 
          job.jobId, 
          job.jobType == 'Script' ? SUBMIT_SCRIPT_JOB_FILE_NAME : SUBMIT_JOB_FILE_NAME,
          job.jobType,
          job.sprayedFileScope,
          job.sprayFileName,
          job.sprayDropZone);
      } catch (err) {
        console.log(err);
      }
    }
  }

  async scheduleActiveCronJobs() {
    let promises=[];
    const query = `SELECT ad.id, ad.cron, j.name as name, j.jobType, j.sprayedFileScope, j.sprayFileName, j.sprayDropZone, ad.dataflowId, ad.assetId, d.application_id, c.id as clusterId, c.thor_host, c.thor_port,
      d.title as dataflowName
      FROM tombolo.assets_dataflows ad
      left join dataflow d on d.id = ad.dataflowId
      left join job j on j.id = ad.assetId
      left join cluster c on c.id = d.clusterId
      where ad.cron IS NOT NULL
      order by ad.updatedAt desc
      ;`;

    const jobs = await models.sequelize.query(query, {
      type: models.sequelize.QueryTypes.SELECT,
    });

    for(const job of jobs) {
      console.log(`
        fetch WU id from ${job.thor_host}:${job.thor_port}/WsWorkunits/WUQuery.json for job name: ${job.name}
        add job to bree { name: ${job.name}, cron: ${job.cron}, path: ..., workerData: {workunitId: $WUID, cluster: ${job.thor_host}, ...} }
      `);
      try {
        //finally add the job to the scheduler
        await this.addJobToScheduler(
          job.name, 
          job.cron, 
          job.clusterId, 
          job.dataflowId, 
          job.application_id, 
          job.assetId, 
          job.jobType == 'Script' ? SUBMIT_SCRIPT_JOB_FILE_NAME : SUBMIT_JOB_FILE_NAME,
          job.jobType,
          job.sprayedFileScope,
          job.sprayFileName,
          job.sprayDropZone
        );
      } catch (err) {
        console.log(err);
      }
     }
  }

  async scheduleMessageBasedJobs(message) {
    console.log('scheduleMessageBasedJobs')
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
        console.error("***Could not find job with name "+message.jobName);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async addJobToScheduler(name, cron, clusterId, dataflowId, applicationId, jobId, jobfileName, jobType, sprayedFileScope, sprayFileName, sprayDropZone) {
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
            sprayedFileScope: sprayedFileScope,
            sprayFileName: sprayFileName,
            sprayDropZone: sprayDropZone
          }
        }
      })

      this.bree.start(uniqueJobName);
    } catch (err) {
      console.log(err);
    }
  }

  async executeJob(name, clusterId, dataflowId, applicationId, jobId, jobfileName, jobType, sprayedFileScope, sprayFileName, sprayDropZone) {
    try {
      let uniqueJobName = name + '-' + dataflowId + '-' + jobId;
      await this.removeJobFromScheduler(uniqueJobName);
      this.bree.add({
        name: uniqueJobName,
        timeout: 0,
        path: path.join(__dirname, 'jobs', jobfileName),
        worker: {
          workerData: {
            jobName: name,
            clusterId: clusterId,
            jobId: jobId,
            applicationId: applicationId,
            dataflowId: dataflowId,
            jobType: jobType,
            sprayedFileScope: sprayedFileScope,
            sprayFileName: sprayFileName,
            sprayDropZone: sprayDropZone
          }
        }
      })

      this.bree.start(uniqueJobName);
    } catch (err) {
      console.log(err);
    }
  }

  async removeJobFromScheduler(name) {
    try {
      await this.bree.remove(name);
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = new JobScheduler();