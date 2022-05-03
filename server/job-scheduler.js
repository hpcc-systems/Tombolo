const Bree = require('bree');
const models = require('./models');
var path = require('path');
const Job = models.job;
const MessageBasedJobs = models.message_based_jobs;
const DataflowGraph = models.dataflowgraph;
const Dataflow = models.dataflow;
const Cluster = models.cluster;
const { v4: uuidv4 } = require('uuid');
const workflowUtil = require('./utils/workflow-util.js');
const SUBMIT_JOB_FILE_NAME = 'submitJob.js';
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
      errorHandler: (error, workerMetadata) => {
        if (workerMetadata.threadId) {
          console.log( `There was an error while running a worker ${workerMetadata.name} with thread ID: ${workerMetadata.threadId}` );
        } else {
          console.log(`There was an error while running a worker ${workerMetadata.name}`);
        }
        console.error(error);
        //errorService.captureException(error);
      },

      workerMessageHandler: async (worker) => {
        if (worker.message === 'done') console.log(`Worker for job '${worker.name}' signaled 'done'`);
        if (worker.message.action === 'logging') {
          console.log(`${worker.name}`);
          console.log('------------------------------------------');
          console.dir(worker.message.data);
          console.log('------------------------------------------');
        }
        if (worker.message.action === 'remove') {
          this.bree.remove(worker.name);
          console.log('------------------------------------------');
          console.log('👷 JOB REMOVED', worker.name);
          console.log('------------------------------------------');
        }
        if (worker.message.action === 'scheduleDependentJobs') {
          await this.scheduleCheckForJobsWithSingleDependency({ ...worker.message.data });
        }
      },
    });
  }

  bootstrap() {
    (async () => {
      console.log('------------------------------------------');
      console.log('✔️ JOBSCHEDULER IS BOOTSTRAPED, job-scheduler.js: class JobScheduler ');
      console.log('------------------------------------------');
      await this.scheduleActiveCronJobs();
      await this.scheduleJobStatusPolling();
      await this.scheduleFileMonitoring();
    })()
  }

  async scheduleCheckForJobsWithSingleDependency({ dependsOnJobId, dataflowId, jobExecutionGroupId }) {
    try {
      const dataflowGraph = await DataflowGraph.findOne({ where: { dataflowId } });
      if (!dataflowGraph) throw new Error('Dataflow does not exist');

      const dependantJobs = dataflowGraph.graph.cells.reduce((acc, cell) => {
        if (cell?.data?.schedule?.dependsOn?.includes(dependsOnJobId))
          acc.push({ jobId: cell.data.assetId });
        return acc;
      }, []);

      console.log('------------------------------------------');
      console.log(`✔️  FOUND ${dependantJobs.length} DEPENDENT JOB/S`);
      console.log('------------------------------------------');

      if (dependantJobs.length === 0 && dataflowId) {
        console.log('------------------------------------------');
        console.log('WORKFLOW EXECUTION COMPLETE, Checking if subscribed for notifications.');
        console.log('------------------------------------------');
        try {
          const dataflow = await Dataflow.findOne({ where: { id: dataflowId } });
          const cluster = await Cluster.findOne({ where: { id: dataflow.clusterId } });

          const notify = dataflow.dataValues?.metaData?.notification?.notify;

          if (notify === 'Always' || notify === 'Only on success') {
            const hpccURL = `${cluster.thor_host}:${cluster.thor_port}/#/stub/ECL-DL/Workunits-DL/Workunits`;
            const { recipients, success_message } = dataflow.dataValues.metaData.notification;

            workflowUtil.notifyWorkflowExecutionStatus({
              appId: dataflow.application_id,
              dataflowName: dataflow.title,
              executionStatus: 'completed',
              clusterName: cluster.name,
              dataflowId: dataflow.id,
              jobExecutionGroupId,
              success_message,
              recipients,
              hpccURL,
            });
          }
        } catch (error) {
          console.log('------------------------------------------');
          console.log(error);
          console.log('------------------------------------------');
        }
      } else {
        const failedJobsList = [];

        for (let i = 0; i < dependantJobs.length; i++) {
          try {
            const dependantJob = dependantJobs[i];
            let job = await Job.findOne({ where: { id: dependantJob.jobId } });

            let status;
            const isSprayJob = job.jobType == 'Spray';
            const isScriptJob = job.jobType == 'Script';
            const isManualJob = job.jobType === 'Manual';
            const isGitHubJob = job.metaData?.isStoredOnGithub;

            console.log('------------------------------------------');
            console.log( `🔄  scheduleCheckForJobsWithSingleDependency: EXECUTING DEPENDANT JOB "${job.name}" id:${job.id}; dflow: ${dataflowId};` );
            console.log('------------------------------------------');

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
            } else {
              status = this.executeJob({ jobfileName: SUBMIT_JOB_FILE_NAME, ...commonWorkerData });
            }
            if (!status.success) throw status;
          } catch (error) {
            console.log(error); // failed to execute dependent job through bree. Should notify user.
            if (error.contact) failedJobsList.push(error);
          }
        } // for loop ends.

        if (failedJobsList.length > 0) {
          const contact = failedJobsList[0].contact;
          const dataflowId = failedJobsList[0].dataflowId;
          await workflowUtil.notifyDependentJobsFailure({ contact, dataflowId, failedJobsList });
        }
      }
    } catch (err) {
      console.log('-error-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
      // TODO FAILED TO SCHEDULE, inform user?
    }
  }

  async scheduleActiveCronJobs() {
    try {
      // get all dataflowsGraphs
      const dataflowsGraphs = await DataflowGraph.findAll();

      for (const dataflowsGraph of dataflowsGraphs) {
        const cronScheduledNodes = dataflowsGraph.graph?.cells?.filter((cell) => cell.data?.schedule?.cron) || [];
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
                dataflowId: dataflowsGraph.dataflowId,
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
              console.log('-error-----------------------------------------');
              console.dir({ error }, { depth: null });
              console.log('------------------------------------------');
            }
          }
        }
      }
    } catch (error) {
      console.log('-!!!!FAILED TO SCHEDULE ACTIVE JOBS IN BREE!!-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
    }
    console.log('------------------------------------------');
    console.log(`📢 ACTIVE CRON JOBS (${this.bree.config.jobs.length}) (does not include dependent jobs):`);
    this.logBreeJobs();
    console.log('------------------------------------------');
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
        console.log('------------------------------------------');
        console.error('📢 COULD NOT FIND JOB WITH NAME ' + message.jobName);
        console.log('------------------------------------------');
      }
    } catch (err) {
      console.log(err);
    }
  }

  addJobToScheduler({  skipLog = false, ...jobData }) {
    try {
      let uniqueJobName = jobData.jobName + '-' + jobData.dataflowId + '-' + jobData.jobId;
      this.createNewBreeJob({ uniqueJobName, ...jobData });
      this.bree.start(uniqueJobName);
      console.log('------------------------------------------');
      console.log(`📢 JOB WAS SCHEDULED AS - ${uniqueJobName},  job-scheduler.js: addJobToScheduler`);
      !skipLog && this.logBreeJobs();
      console.log('------------------------------------------');
      return {success: true}
    } catch (err) {
      console.log('-err-----------------------------------------');
      console.dir({err}, { depth: null });
      console.log('------------------------------------------');
      const part2 = err.message.split(' an ')?.[1]  // error message is not user friendly, we will trim it to have everything after "an".
      if (part2) err.message = part2;
      return {success: false, error: err.message }
    }
  }

  executeJob(jobData) {
    try {
      let uniqueJobName = jobData.jobName + '-' + jobData.dataflowId + '-' + jobData.jobId + '-' + uuidv4();
      this.createNewBreeJob({...jobData, uniqueJobName});
      this.bree.start(uniqueJobName);
      console.log('------------------------------------------');
      console.log(`✔️  BREE HAS STARTED JOB: "${uniqueJobName}"`);
      this.logBreeJobs();
      console.log('------------------------------------------');
      return { success: true, message: `Successfully executed ${jobData.jobName }` };
    } catch (err) {
      console.log(err);
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

  createNewBreeJob({ uniqueJobName, cron, jobfileName, sprayedFileScope, manualJob_meta, sprayFileName, sprayDropZone, applicationId, dataflowId, clusterId, metaData, jobName, contact, jobType, status, jobId, title, jobExecutionGroupId }) {
    const job = {
      name: uniqueJobName,
      path: path.join(__dirname, 'jobs', jobfileName),
      worker: {
        workerData: {
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

  async removeJobFromScheduler(name ) {
    try {
       const existingJob = this.bree.config.jobs.find(job=> job.name === name);
      if (existingJob) {
        await this.bree.remove(name);
        console.log('📢 -Job removed from Bree-----------------------------------------');
        console.dir(existingJob.name, { depth: null });
        console.log('------------------------------------------');
      }
    } catch (err) {
      console.log(err);
    }
  }

  async removeAllFromBree(namePart) {
    try {
      const existingJobs = this.bree.config.jobs.filter((job) => job.name.includes(namePart));
      if (existingJobs.length > 0) {
        for (const job of existingJobs) {
          try {
            await this.bree.remove(job.name);
            console.log('📢 -Job removed from Bree-----------------------------------------');
            console.dir(job.name, { depth: null });
            console.log('------------------------------------------');
          } catch (error) {
            console.log('-Failed to remove job from Bree------------------------------------');
            console.dir({ error }, { depth: null });
            console.log('------------------------------------------');
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
  
  async scheduleJobStatusPolling() {
    console.log('------------------------------------------');
    console.log('📢 STATUS POLLING SCHEDULER STARTED...');
    console.log('------------------------------------------');
    try {
      let jobName = 'job-status-poller-' + new Date().getTime();
      
      this.bree.add({
        name: jobName,
        interval: '20s',
        path: path.join(__dirname, 'jobs', JOB_STATUS_POLLER),
        worker: {
          workerData: {
            jobName: jobName,
          },
        },
      });

      this.bree.start(jobName);
    } catch (err) {
      console.log(err);
    }
  }

  // FILE MONITORING POLLER
  async scheduleFileMonitoring() {    
    console.log("📂 FILE MONITORING STARTED ....");  
    try { 
      let jobName = 'file-monitoring-' + new Date().getTime();
        this.bree.add({
          name: jobName,
          interval: '500s',
          path: path.join(__dirname, 'jobs', FILE_MONITORING),
          worker: {
            workerData: {
              jobName: jobName
            }
          }
        })

        this.bree.start(jobName);    
    } catch (err) {
      console.log(err);
    }
  }

  // Console.log Bree Active Bree Jobs 
  logBreeJobs() {
    const jobs = this.bree.config.jobs.filter((job) => {
      if (job.name.includes('job-status-poller')) return false; // hide status poller from logs
      if (job.name.includes('file-monitoring')) return false;// hide file monitoring from logs
      return true;
      });
    console.dir(
      jobs.map((job) => ({
        name: job.name,
        cron: job.cron,
        jobName: job.worker?.workerData?.jobName,
        dataflowId: job.worker?.workerData?.dataflowId,
        group: job.worker?.workerData?.jobExecutionGroupId,
      })),
      { depth: 4 }
    );
  }
}

module.exports = new JobScheduler();
