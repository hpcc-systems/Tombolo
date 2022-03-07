const express = require('express');
const router = express.Router();
var models  = require('../../models');
let Sequelize = require('sequelize');
const Op = Sequelize.Op;
let Job = models.job;
let JobFile = models.jobfile;
let JobParam = models.jobparam;
let File = models.file;
let FileLayout = models.file_layout;
let FileValidation = models.file_validation;
let DataflowGraph = models.dataflowgraph;
let Dataflow = models.dataflow;
let AssetDataflow = models.assets_dataflows;
let DependentJobs = models.dependent_jobs;
let AssetsGroups = models.assets_groups;
let JobExecution = models.job_execution;
let MessageBasedJobs = models.message_based_jobs;
const JobScheduler = require('../../job-scheduler');
const hpccUtil = require('../../utils/hpcc-util');
const workFlowUtil = require('../../utils/workflow-util');
const validatorUtil = require('../../utils/validator');
const { body, query, param, validationResult } = require('express-validator');
const assetUtil = require('../../utils/assets');
const crypto = require('crypto');
const algorithm ='aes-256-ctr';

const SUBMIT_JOB_FILE_NAME = 'submitJob.js';
const SUBMIT_SPRAY_JOB_FILE_NAME = 'submitSprayJob.js'
const SUBMIT_SCRIPT_JOB_FILE_NAME = 'submitScriptJob.js';
const SUBMIT_MANUAL_JOB_FILE_NAME = 'submitManualJob.js'
const SUBMIT_GITHUB_JOB_FILE_NAME = 'submitGithubJob.js'

const createOrUpdateFile = async ({jobfile, jobId, clusterId, dataflowId, applicationId}) =>{
  try {
    const fileInfo = await hpccUtil.fileInfo(jobfile.name, clusterId);

    if (fileInfo) {
      // create or update File
      const fileFields = {
        title: fileInfo.basic.fileName,
        scope: fileInfo.basic.scope,
        fileType: fileInfo.basic.fileType,
        isSuperFile: fileInfo.basic.isSuperfile, //!!  we keep the value camelCased when hpcc return isSuperfile
        description: fileInfo.basic.description,
        qualifiedPath: fileInfo.basic.pathMask,
      };

      let [file, isFileCreated] = await File.findOrCreate({
        where: {
          name: fileInfo.basic.name,
          cluster_id: clusterId,
          application_id: applicationId,
        },
        defaults: fileFields,
      });
      if (!isFileCreated) file = await file.update(fileFields);

      // create or update FileLayout
      const layoutFields = { fields: JSON.stringify(fileInfo.file_layouts) };

      let [layout, isLayoutCreated] = await FileLayout.findOrCreate({
        where: {
          file_id: file.id,
          application_id: file.application_id,
        },
        defaults: layoutFields,
      });
      if (!isLayoutCreated) layout = await layout.update(layoutFields);

      // updateCommonData
      const fileValidations = fileInfo.file_validations.map((el) => ({
        ...el,
        file_id: file.id,
        application_id: file.application_id,
      }));

      // create FileValidation
      await FileValidation.bulkCreate(fileValidations, {
        updateOnDuplicate: ['name', 'ruleType', 'rule', 'action', 'fixScript'],
      });

      // create or update JobFile relationship
      const jobfileFields = {
        name: file.name,
        file_type: jobfile.file_type,
        description: file.description,
      };

      let [jobFile, isJobFileCreated] = await JobFile.findOrCreate({
        where: {
          job_id: jobId,
          file_id: file.id,
          file_type: jobfile.file_type,
          application_id: file.application_id,
        },
        defaults: jobfileFields,
      });
      if (!isJobFileCreated) jobFile = await jobFile.update(jobfileFields);

      // create assetDataflow if still not exists
      await AssetDataflow.findOrCreate({
        where: {
          assetId: file.id,
          dataflowId: dataflowId,
        },
      });
      // construct object with fields that is going to be used to create a graph nodes
      const relatedFile = {
        name: file.name,
        assetId: file.id,
        relatedTo: jobId,
        title: file.title,
        isSuperFile: file.isSuperFile,
        file_type: jobfile.file_type, //'input' | 'output'
        description: file.description,
      };
      // ADD FILE TO RELATED FILE LIST
      return relatedFile;
    }
  } catch (error) {
    console.log('------------------------------------------');
    console.dir({ error }, { depth: null });
    return null;
  }
}; 

router.post( '/jobFileRelation',
  [
    body('jobId').optional({ checkFalsy: true }).isUUID(4).withMessage('Invalid job id'),
    body('dataflowId').optional({ checkFalsy: true }).isUUID(4).withMessage('Invalid dataflowId'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    console.time('jobFileRelation');

    try {
      const job = await Job.findOne({ where: { id: req.body.jobId } });
      if (!job) throw new Error('Job does not exist');

      const result = await hpccUtil.getJobWuDetails(job.cluster_id, job.name);
      if (!result.wuid) throw new Error('Could not find WU details by job name');

      const jobInfo = await hpccUtil.getJobInfo(job.cluster_id, result.wuid, job.jobType);
      const jobfiles = jobInfo?.jobfiles;
      //{ jobfiles: [ { name: 'covid19::kafka::guid', file_type: 'input' } ,{ name: 'covid19::kafka::guid', file_type: 'output' } ] }
      
      const relatedFiles = [];
      
      if (jobfiles?.length > 0) {
        for (const jobfile of jobfiles) {
          // jobfiles array has many files with same name but file_type is different;
          // when we lookup in HPCC by file name and update our tables we dont need to do it for files with same name.
          // if file was already processed we need to create new JOBFILE record with different file_type and skip createOrUpdateFile(...)
          const duplicateFile = relatedFiles.find((file) => file.name === jobfile.name);

          if (duplicateFile) {
            const jobfileFields = {
              name: duplicateFile.name,
              file_type: jobfile.file_type,
              description: duplicateFile.description,
            };
      
            let [jobFile, isJobFileCreated] = await JobFile.findOrCreate({
              where: {
                job_id: job.id,
                file_id: duplicateFile.assetId,
                file_type: jobfile.file_type,
                application_id: job.application_id,
              },
              defaults: jobfileFields,
            });

            if (!isJobFileCreated) jobFile = await jobFile.update(jobfileFields);
            relatedFiles.push({ ...duplicateFile, file_type: jobfile.file_type });
          } else {
            // create or update JobFile relationship
            const file = await createOrUpdateFile({
              jobId: job.id,
              jobfile: jobfile, //{ name: 'covid19::kafka::guid', file_type: 'output' }
              clusterId: job.cluster_id,
              dataflowId: req.body.dataflowId,
              applicationId: job.application_id,
            });
            if (file) {
              relatedFiles.push(file);
            }
          }
        }
      }
      console.log('------------------------------------------');
      console.timeEnd('jobFileRelation');
      console.log('------------------------------------------');
      res.send(relatedFiles);
    } catch (error) {
      console.log('-error /jobFileRelation-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
      res.status(500).send('Could not find related files');
    }
  }
);

router.post('/syncDataflow', [
  body('dataflowId').isUUID(4).withMessage('Invalid dataflow id'),
  body('application_id').isUUID(4).withMessage('Invalid application id'),
], async (req, res) => {
  // {
  //   applicationId: 'e06563e9-9490-4940-a737-bad9a5a765ee',
  //   dataflowId: '898a568d-9fed-4464-bf94-8a4609f198cd',
  //   clusterId: 'd399a40a-e2b3-4b65-9804-266ef2031cee',
  //   jobList: [
  //     { id: '708da72c-2d96-4066-be64-86e8342432cc', name: 'getCars.ecl' }
  //   ]
  console.log('-req.body-----------------------------------------');
  console.dir(req.body, { depth: null });
  console.log('------------------------------------------');
try {
  
  const { applicationId, dataflowId, clusterId, jobList } = req.body

  const filesPromises = [];

  for ( const job of jobList) {
    const getFiles = new Promise(async(resolve, reject) =>{
        try {
          const result = await hpccUtil.getJobWuDetails(clusterId, job.name);
        if (!result.wuid) throw new Error('Could not find WU details by job name');
    
        const jobInfo = await hpccUtil.getJobInfo(clusterId, result.wuid, "Job" );
        const jobfiles = jobInfo?.jobfiles;
        //{ jobfiles: [ { name: 'usa::cars.csv', file_type: 'input' } ] }
        const relatedFiles=[];
        if (jobfiles?.length > 0) {
          for (const jobfile of jobfiles) {
           const file = await createOrUpdateFile({ jobId: job.id, applicationId, dataflowId, clusterId, jobfile, })
            if (file){
              relatedFiles.push(file)
            }
          }
        }
        resolve({job:job.id, relatedFiles})
      } catch (error) {
        console.log('error', error);
        reject();
      }
    })
    
    filesPromises.push(getFiles)
  }

  const settled = await Promise.allSettled(filesPromises);

  const result = settled.reduce((acc,el) =>{
    if (el.status === 'fulfilled'){
      acc.push(el.value)
    }
    return acc;
  },[])

  const allAssetsIds = [];

  // Delete JobFile record if file is not associated anymore
  if (result.length > 0) {    
    for (const record of result){
      if (record.relatedFiles.length > 0 ){
        const filesIds = record.relatedFiles.map(file => file.assetId) 
        allAssetsIds.push(filesIds)     
        try {
          const deleted = await JobFile.destroy({
            where:{
              job_id: record.job,
              application_id: applicationId,
              file_id:{
                [Op.not]: filesIds
              }
            }}) 
            console.log('-deleted-----------------------------------------');
            console.dir({deleted}, { depth: null });
            console.log('------------------------------------------');
          } catch (error) {
            console.log('error', error);
          }
        }
      }
  }
  const respond= {
    result, // array of {job:<assetId>, relatedFiles:{...}}
    assetsIds: allAssetsIds.flat(Infinity) // array of strings of all assetIds created or modified
  }
  console.log('-respond-----------------------------------------');
  console.dir({respond}, { depth: null });
  console.log('------------------------------------------');
  res.json(respond);
} catch (error) {
  console.log(err);
  return res.status(500).json({ success: false, message: "Error occurred while updating" });
}
});

router.post('/saveJob', [
  body('id')
  .optional({checkFalsy:true})
    .isUUID(4).withMessage('Invalid id'),
  body('job.basic.application_id')
    .isUUID(4).withMessage('Invalid application id'),
  body('job.basic.name')
  .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_. \-:]*$/).withMessage('Invalid name'),
  body('job.basic.title')
  .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_. \-:]*$/).withMessage('Invalid title'),
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);

  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[saveJob] - Get file list for app_id = " + req.body.job.basic.application_id + " isNewJob: "+req.body.isNew);
  var jobId=req.body.id, applicationId=req.body.job.basic.application_id, fieldsToUpdate={}, nodes=[], edges=[];
  
  try {

    Job.findOne({where: {name: req.body.job.basic.name, application_id: applicationId}, attributes:['id']}).then(async (existingJob) => {
      let job = null;
      if (!existingJob) {
        job = await Job.create(req.body.job.basic);
      } else {
        job = await Job.update(req.body.job.basic, {where:{application_id: applicationId, id:req.body.id}}).then((updatedIndex) => {
          return updatedIndex;
        })
      }
      let jobId = job.id ? job.id : req.body.id;
      if (req.body.job.basic && req.body.job.basic.groupId) {
        let assetsGroupsCreated = await AssetsGroups.findOrCreate({
          where: {assetId: jobId, groupId: req.body.job.basic.groupId},
          defaults:{
            assetId: jobId,
            groupId: req.body.job.basic.groupId
          }
        })
      }     

      switch (req.body.job.schedule.type) { 
        case "":
          AssetDataflow.update({
            cron: null,
          }, {
            where: { assetId: jobId, dataflowId: req.body.job.basic.dataflowId }
          }).then(async (assetDataflowupdated) => {
             await JobScheduler.removeJobFromScheduler(req.body.job.basic.name + '-' + req.body.job.basic.dataflowId + '-' + req.body.id);
          })
          await DependentJobs.destroy({
            where: {
              jobId: jobId,
              dataflowId: req.body.job.basic.dataflowId
            }
          });
          await MessageBasedJobs.destroy({
            where: {
              jobId: jobId,
              dataflowId: req.body.job.basic.dataflowId,
              applicationId: req.body.job.basic.application_id
            }
          });
          return res.json({
            success: true,
            type: "",
            jobs: [],
            jobId: jobId,
            title: req.body.job.basic.title
          });
          break;
        case 'Predecessor':
          await AssetDataflow.update({
            cron: null,
          }, {
            where: { assetId: jobId, dataflowId: req.body.job.basic.dataflowId }
          }).then(async (assetDataflowupdated) => {
             await JobScheduler.removeJobFromScheduler(req.body.job.basic.name + '-' + req.body.job.basic.dataflowId + '-' + req.body.id);
          })
          await MessageBasedJobs.destroy({
            where: {
              jobId: jobId,
              dataflowId: req.body.job.basic.dataflowId,
              applicationId: req.body.job.basic.application_id
            }
          });
          await DependentJobs.destroy({
            where: {
              jobId: jobId,
              dataflowId: req.body.job.basic.dataflowId
            }
          });
          const promises = req.body.job.schedule.jobs.map(async dependsOnJobId => {
            await DependentJobs.create({
              jobId: jobId,
              dataflowId: req.body.job.basic.dataflowId,
              dependsOnJobId: dependsOnJobId
            });
          });

          await Promise.all(promises);
          return res.json({
            success: true,
            type: req.body.job.schedule.type,
            jobs: req.body.job.schedule.jobs,
            jobId: jobId,
            title: req.body.job.basic.title
          });
          break;
          
        case 'Time':
          try {
            let cronExpression = req.body.job.schedule.cron['minute'] + ' ' +
              req.body.job.schedule.cron['hour'] + ' ' +
              req.body.job.schedule.cron['dayMonth'] + ' ' +
              req.body.job.schedule.cron['month'] + ' ' +
              req.body.job.schedule.cron['dayWeek'];

            let success = await AssetDataflow.update({
                cron: cronExpression,
              }, {
                where: { assetId: jobId, dataflowId: req.body.job.basic.dataflowId }
              });
            if(success || success[0]) {
              await DependentJobs.destroy({
                where: {
                  jobId: jobId,
                  dataflowId: req.body.job.basic.dataflowId
                }
              });

              const fileName = () =>{
                switch (req.body.job.basic.jobType){
                  case 'Script':
                    return SUBMIT_SCRIPT_JOB_FILE_NAME;
                  case 'Manual' :
                    return SUBMIT_MANUAL_JOB_FILE_NAME;
                  default : {
                    if (req.body.job.basic?.metaData.isStoredOnGithub){
                      return SUBMIT_GITHUB_JOB_FILE_NAME
                    }else{
                      return SUBMIT_JOB_FILE_NAME
                    }
                  }
                }
              }
              
              //remove existing job with same name
              try {
                  await JobScheduler.removeJobFromScheduler(req.body.job.basic.name + '-' + req.body.job.basic.dataflowId + '-' + jobId);
                  
                  const jobSettings ={	
                    jobName: req.body.job.basic.name, 
                    title: req.body.job.basic.title,	
                    cron: cronExpression, 	
                    clusterId: req.body.job.basic.cluster_id,	
                    dataflowId: req.body.job.basic.dataflowId,	
                    applicationId: req.body.job.basic.application_id,	
                    jobId: jobId,	
                    jobfileName: fileName(),	
                    jobType: req.body.job.basic.jobType,	
                    sprayedFileScope: job.sprayedFileScope,	
                    sprayFileName: job.sprayFileName, 
                    sprayDropZone: job.sprayFileName,
                    metaData: req.body.job.basic.metaData,
                    contact : req.body.job.basic.contact,
                  }
                  
                  if(jobSettings.jobType === "Manual"){ 
                    jobSettings.status = 'wait';
                    jobSettings.manualJob_meta = {jobType : 'Manual', jobName: jobSettings.jobName, notifiedTo : jobSettings.contact, notifiedOn : new Date().getTime()}
                  }
                  
                  JobScheduler.addJobToScheduler(jobSettings);
         
                } catch (err) {
                console.log("could not remove job from scheduler"+ err)
              }
            }

            if (!success || !success[0]) {
              return res.json({
                success: false,
                message: 'Unable to save job schedule'
              });
            }
            return res.json({
              success: true,
              type: req.body.job.schedule.type,
              cron: req.body.job.schedule.cron,
              jobId: jobId,
              title: req.body.job.basic.title
            });
            
          } catch (err) {
            console.log(err);
            return res.json({
              success: false,
              message: 'Unable to save job schedule'
            });
          }
          break;
        case 'Message':
          try {
            await AssetDataflow.update({
              cron: null,
            }, {
              where: { assetId: jobId, dataflowId: req.body.job.basic.dataflowId }
            }).then(async (assetDataflowupdated) => {
                await JobScheduler.removeJobFromScheduler(req.body.job.basic.name + '-' + req.body.job.basic.dataflowId + '-' + req.body.id);
            })

            await DependentJobs.destroy({
              where: {
                jobId: jobId,
                dataflowId: req.body.job.basic.dataflowId
              }
            });

            MessageBasedJobs.findOrCreate({
              where: {
                jobId: jobId,
                applicationId: req.body.job.basic.application_id,
                dataflowId: req.body.job.basic.dataflowId
              },
              defaults: {
                jobId: jobId,
                dataflowId: req.body.job.basic.dataflowId,
                applicationId: req.body.job.basic.application_id,
              }
            })
            return res.json({
              success: true,
              type: req.body.job.schedule.type,
              jobs: req.body.job.schedule.jobs,
              jobId: jobId,
              title: req.body.job.basic.title
            });
            break;
          } catch (err) {
            console.log(err);
            return res.json({
              success: false,
              message: 'Unable to save job schedule'
            });
          }
      }
    return res.json({"success": true, "title":req.body.job.basic.title, "jobId":job.id});
  });

  } catch (err) {
    console.log('err', err);
  }
});

router.get('/job_list', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),
  query('dataflowId')
    .isUUID(4).withMessage('Invalid dataflow id'),
    query('clusterId')
    .isUUID(4).withMessage('Invalid cluster id'),
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[job list/read.js] - Get job list for app_id = " + req.query.app_id);
  try {
    let dataflowId = req.query.dataflowId;
    let query = 'select j.id, j.name, j.title, j.jobType, j.metaData, j.description, j.createdAt from job j '+
    'where j.id not in (select asd.assetId from assets_dataflows asd where asd.dataflowId = (:dataflowId) and asd.deletedAt is null)'+    
    'and j.application_id = (:applicationId)'+
    'and j.cluster_id = (:clusterId)'+
    'and j.deletedAt is null;';
    /*let query = 'select j.id, j.name, j.title, j.createdAt, asd.dataflowId from job j, assets_dataflows asd where j.application_id=(:applicationId) '+
        'and j.id = asd.assetId and j.id not in (select assetId from assets_dataflows where dataflowId = (:dataflowId))';*/
    let replacements = { applicationId: req.query.app_id, dataflowId: dataflowId, clusterId: req.query.clusterId};
    let existingFile = models.sequelize.query(query, {
      type: models.sequelize.QueryTypes.SELECT,
      replacements: replacements
    }).then((jobs) => {
      res.json(jobs);
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Error occurred while retrieving jobs" });
    });
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occurred while retrieving jobs" });
  }
});

router.get('/job_details', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),
  query('job_id')
    .isUUID(4).withMessage('Invalid job id'),
  query('dataflow_id')
    .optional({ checkFalsy: true })
    .isUUID(4).withMessage('Invalid dataflow id'),
], async (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log(`[job_details] - Get job list for:
    app_id = ${req.query.app_id}
    query_id = ${req.query.job_id}
    dataflow_id = ${req.query.dataflow_id}
  `);
  let jobFiles = [];
  try {
    Job.findOne({
      where: { "application_id": req.query.app_id, "id":req.query.job_id },
      include: [JobFile, JobParam, JobExecution],
      attributes: { exclude: ['assetId'] },
    }).then(async function(job) {
      if(job) {       
        const isStoredOnGithub = job?.metaData?.isStoredOnGithub;
        const jobStatus = job.job_executions?.[0]?.status;
        const ecl = job.ecl
        if(isStoredOnGithub && !ecl && (jobStatus === 'completed' || jobStatus === "failed" )) { 
          const wuid = job.job_executions[0].wuid;
          const { application_id, cluster_id, jobType,id } = job;
 
          try{
            const hpccJobInfo = await hpccUtil.getJobInfo(cluster_id, wuid, jobType);
            // #1 create records in Files and JobFiles
            hpccJobInfo.jobfiles.forEach( async (file) => await assetUtil.createFilesandJobfiles({file, cluster_id, application_id, id}));
            // #2 update local job instance and save ECL to DB.
            const jobFiles = await job.getJobfiles(); 
            // this will update local instance only
            job.set("jobfiles", jobFiles);
            job.set("ecl",  hpccJobInfo.ecl);
            await job.save()  
          } catch (error){
            console.log('------------------------------------------');
            console.log(`FAILED TO UPDATE ECL FOR "${job.name}"`);
            console.dir(error, { depth: null });
            console.log('------------------------------------------');
          }
        }
       var jobData = job.get({ plain: true });

       for (const jobFileIdx in jobData.jobfiles) {
          var jobFile = jobData.jobfiles[jobFileIdx];
          var file = await File.findOne({where:{"application_id":req.query.app_id, "id":jobFile.file_id}});
          if (file != undefined) {
            jobFile.description = file.description;
            jobFile.groupId = file.groupId;
            jobFile.title = file.title;
            jobFile.name = file.name;
            jobFile.fileType = file.fileType;
            jobFile.qualifiedPath = file.qualifiedPath;
            jobData.jobfiles[jobFileIdx] = jobFile;
          }
        }
        if (req.query.dataflow_id) {
          let assetDataflow = await AssetDataflow.findOne({
            where: { assetId: req.query.job_id, dataflowId: req.query.dataflow_id }
          });
          let dependentJobs = await DependentJobs.findAll({
            where: { jobId: req.query.job_id, dataflowId: req.query.dataflow_id }
          });
          let messageBasedJobs = await MessageBasedJobs.findAll({
            where: { jobId: req.query.job_id, dataflowId: req.query.dataflow_id, applicationId: req.query.app_id}
          });
          if (assetDataflow && assetDataflow.cron !== null) {
            jobData.schedule = {
              type: 'Time',
              cron: assetDataflow.cron
            };
          } else if (dependentJobs.length > 0) {
            jobData.schedule = {
              type: 'Predecessor',
              jobs: []
            };
            dependentJobs.map(job => jobData.schedule.jobs.push(job.dependsOnJobId));
          } else if (messageBasedJobs.length > 0) {
            jobData.schedule = {
              type: 'Message'
            };
          }
        }

        return jobData;
      } else {
        return res.status(500).json({ success: false, message: "Job details could not be found. Please check if the job exists in Assets. " });
      }
    }).then(function(jobData) {
        res.json(jobData);
    })
    .catch(function(err) {
        console.log(err);
    });
  } catch (err) {
      console.log('err', err);
  }
});

router.post( '/delete',
  [
    body('application_id').isUUID(4).withMessage('Invalid application id'),
    body('jobId').isUUID(4).withMessage('Invalid job id'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    console.log('[delete/read.js] - delete job = ' + req.body.jobId + ' appId: ' + req.body.application_id);

    try {
      await Promise.all([
        Job.destroy({ where: { id: req.body.jobId, application_id: req.body.application_id } }),
        JobFile.destroy({ where: { job_id: req.body.jobId } }),
        JobParam.destroy({ where: { job_id: req.body.jobId } }),
        AssetDataflow.destroy({ where: { assetId: req.body.jobId } }),
      ]);
      res.json({ result: 'success' });
    } catch (error) {
      console.log(err);
      return res.status(500).json({ success: false, message: 'Error occured while deleting the job' });
    }
  }
);


router.post('/executeJob', [
  body('clusterId')
  .optional({ checkFalsy: true }).isUUID(4).withMessage('Invalid cluster id'),
  body('jobId')
      .isUUID(4).withMessage('Invalid job id'),
  body('applicationId')
      .isUUID(4).withMessage('Invalid application id'),
  body('dataflowId').optional({ checkFalsy: true })
      .isUUID(4).withMessage('Invalid dataflow id'),
  body('jobName')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_.\-: ]*$/).withMessage('Invalid job name'),
], async (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
    const job = await Job.findOne({where: {id:req.body.jobId}, attributes: {exclude: ['assetId']}, include: [JobParam]});
    
    let status;

    const isSprayJob = job.jobType == 'Spray';
    const isScriptJob = job.jobType == 'Script';
    const isManualJob = job.jobType === 'Manual';
    const isGitHubJob = job.metaData?.isStoredOnGithub;
    
    const commonWorkerData = { 
      applicationId: req.body.applicationId,
      dataflowId: req.body.dataflowId,
      clusterId: req.body.clusterId,
      jobName : req.body.jobName,
      jobId: req.body.jobId
    };
      
    if (isSprayJob) {
      status = JobScheduler.executeJob({ jobfileName: SUBMIT_SPRAY_JOB_FILE_NAME, ...commonWorkerData, sprayedFileScope: job.sprayedFileScope, sprayFileName: job.sprayFileName, sprayDropZone: job.sprayDropZone });
    } else if (isScriptJob) {
      status = JobScheduler.executeJob({ jobfileName: SUBMIT_SCRIPT_JOB_FILE_NAME, ...commonWorkerData });
    } else if (isManualJob){
      status = JobScheduler.executeJob({ jobfileName: SUBMIT_MANUAL_JOB_FILE_NAME, ...commonWorkerData, status : 'wait', manualJob_meta : { jobType : 'Manual', jobName: job.name, notifiedTo : job.contact, notifiedOn : new Date().getTime() } });
    } else if (isGitHubJob) {
      status = JobScheduler.executeJob({ jobfileName: SUBMIT_GITHUB_JOB_FILE_NAME, ...commonWorkerData,  metaData : job.metaData, });
    } else {
      status = JobScheduler.executeJob({ jobfileName: SUBMIT_JOB_FILE_NAME, ...commonWorkerData });
    }

    if (!status.success) throw status;

    res.status(200).json({"success":true});
  } catch (err) {
    console.error('err', err);
    return res.status(500).json({ success: false, message: "Error occured while submiting the job" });
  }
});

router.get('/jobExecutionDetails', [
  query('dataflowId')
    .isUUID(4).withMessage('Invalid dataflow id'),
  query('applicationId')
    .isUUID(4).withMessage('Invalid application id'),
],  async (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[jobExecutionDetails] - Get jobExecutionDetails for app_id = " + req.query.applicationId);
  try {
    const jobExecutions = await JobExecution.findAll({
      where:{
        dataflowId: req.query.dataflowId,
        applicationId:req.query.applicationId
       },
       include:[{
        model: Job,
        attributes:['name', 'jobType'],
        paranoid: false // will pull softDeleted Records
      }]
    });

    const formatted = jobExecutions.map(je =>({ // this is the way frontend is expecting this data to come
      id: je.id,
      task: je.jobId, 
      wuid: je.wuid,
      name: je.job.name,
      status: je.status,
      jobType:je.job.jobType,
      updatedAt:je.updatedAt,
      createdAt: je.createdAt,
      wu_end: je.wu_end,
      wu_start: je.wu_start,
      wu_duration:je.wu_duration,
      manualJob_meta: je.manualJob_meta,
      jobExecutionGroupId: je.jobExecutionGroupId,
      clusterId:je.clusterId,
      dataflowId: je.dataflowId,
      applicationId: je.applicationId,
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error('err', err);
    return res.status(500).json({ success: false, message: "Error occured while retrieving Job Execution Details" });
  }
});

//when user responds to a manual job - Update job status and metadata on job execution table
router.post( '/manualJobResponse',
  [
    body('jobExecutionId').isUUID(4).withMessage('Invalid Job Execution Id'),
    body('newManaulJob_meta').notEmpty().withMessage('Invalid meta data'),
  ],
  (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    JobExecution.findOne({ where: { id: req.body.jobExecutionId } })
      .then((jobExecution) => {
        let newMeta = { ...jobExecution.manualJob_meta, ...req.body.newManaulJob_meta };
        jobExecution
          .update({ status: req.body.status, manualJob_meta: newMeta })
          .then(async (jobExecution) => {
            //once the job execution is updated, send confirmation email
            await workFlowUtil.confirmationManualJobAction(jobExecution.manualJob_meta);
            if (jobExecution.status === 'completed') {
              await JobScheduler.scheduleCheckForJobsWithSingleDependency({
                dependsOnJobId: jobExecution.jobId,
                dataflowId: jobExecution.dataflowId,
                jobExecutionGroupId: jobExecution.jobExecutionGroupId,
              });
            }
          })
          .then(res.status(200).json({ success: true }))
          .catch((err) => {
            res.status(501).json({ success: false, message: 'Error occured while saving data' });
          });
      })
      .catch((error) => {
        res.status(501).json({ success: false, data: error });
      });
  }
);



const QueueDaemon = require('../../queue-daemon');

router.get('/msg', (req, res) => {
  if (req.query.topic && req.query.message) {
    QueueDaemon.submitMessage(req.query.topic, req.query.message);
    return res.json({ topic: req.query.topic, message: req.query.message });
  }
});


module.exports = router;