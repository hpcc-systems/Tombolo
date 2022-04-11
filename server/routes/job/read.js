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
const FileTemplate = models.fileTemplate;
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
        file_id: file.id,
        file_type: jobfile.file_type,
        description: file.description,
      };

      let [jobFile, isJobFileCreated] = await JobFile.findOrCreate({
        where: {
          job_id: jobId,
          name: jobfile.name,
          file_type: jobfile.file_type,
          application_id: file.application_id,
        },
        defaults: jobfileFields,
      });
      if (!isJobFileCreated) jobFile = await jobFile.update(jobfileFields);

      // create assetDataflow if still not exists
      if (dataflowId){
        await AssetDataflow.findOrCreate({
          where: {
            assetId: file.id,
            dataflowId: dataflowId,
          },
        });
      }
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

const clearAllPreviousScheduleRecords = async (props) => {       
  return await Promise.all([
    //1. Remove chron expression from assetDataflow table;
    AssetDataflow.update( { cron: null }, { where: { assetId: props.id, dataflowId: props.dataflowId } } ),
    //2. Remove job from Bree
    JobScheduler.removeJobFromScheduler(props.name + '-' + props.dataflowId + '-' + props.id),
    //3. Remove Dependent Job Record
    DependentJobs.destroy({ where: { jobId: props.id, dataflowId: props.dataflowId } }),
    //4. ...
    MessageBasedJobs.destroy({ where: { jobId: props.id, dataflowId: props.dataflowId, applicationId: props.application_id }, }),
  ]);
};

const deleteJob = async (jobId, application_id) =>{
 return await Promise.all([
    Job.destroy({ where: { id: jobId, application_id} }),
    JobFile.destroy({ where: { job_id: jobId } }),
    JobParam.destroy({ where: { job_id: jobId } }),
    AssetDataflow.destroy({ where: { assetId: jobId } }),
  ]);
}

const getManuallyAddedFiles = async (job) =>{
  const manuallyAddedJobs= [];
  // Check if there were manually added files to job via Input/Output file tabs on frontend and add them to main related files list
  const manuallyAddedFiles = await JobFile.findAll({where:{job_id: job.id,  application_id: job.application_id, added_manually: true, file_id :{ [Op.not] : null} }});
  
  if (manuallyAddedFiles.length > 0) {
    for (const el of manuallyAddedFiles) {
      const file = await File.findOne({where:{id : el.file_id}});
      if (file){
        manuallyAddedJobs.push({
          name: file.name,
          assetId: file.id,
          relatedTo: job.id,
          title: file.title,
          isSuperFile: file.isSuperFile,
          file_type: el.file_type, //'input' | 'output'
          description: file.description,
        })
      }
    }
  }
  return manuallyAddedJobs;
}


router.post( '/jobFileRelation',
  [
    body('jobId').optional({ checkFalsy: true }).isUUID(4).withMessage('Invalid job id'),
    body('dataflowId').optional({ checkFalsy: true }).isUUID(4).withMessage('Invalid dataflowId'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
    const {dataflowId} = req.body;
    try {
      const job = await Job.findOne({ where: { id: req.body.jobId } });
      if (!job) throw new Error('Job does not exist');

      const result = await hpccUtil.getJobWuDetails(job.cluster_id, job.name, dataflowId);
      if (!result.wuid) throw new Error('Could not find WU details by job name');

      const jobInfo = await hpccUtil.getJobInfo(job.cluster_id, result.wuid, job.jobType);
      const jobfiles = jobInfo?.jobfiles;
      //{ jobfiles: [ { name: 'covid19::kafka::guid', file_type: 'input' } ,{ name: 'covid19::kafka::guid', file_type: 'output' } ] }

      let relatedFiles = [];
      // Check if there were manually added files to job via Input/Output file tabs on frontend and add them to main related files list
      const manuallyAddedFiles = await getManuallyAddedFiles(job);
      
      if (manuallyAddedFiles.length > 0) relatedFiles = [...manuallyAddedFiles];
 
      // Loop through files receiver from HPCC and make entries into DB and add them to main list
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
              file_id: duplicateFile.assetId,
              description: duplicateFile.description,
            };
      
            let [jobFile, isJobFileCreated] = await JobFile.findOrCreate({
              where: {
                job_id: job.id,
                name: jobfile.name,
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
              dataflowId,
              applicationId: job.application_id,
            });
            if (file) {
              relatedFiles.push(file);
            }
          }
        }
      }
       // START of matching template ------------------
        const templates = await FileTemplate.findAll({
          where: { cluster_id: job.cluster_id, application_id: job.application_id },  
        });

        if(templates.length > 0){
          let fileAndTemplates = []
            relatedFiles.forEach(file =>{
              let{name : fileName, assetId: fileId, relatedTo, title : fileTitle, isSuperFile, file_type, description : fileDescription} = file;
              for(let i = 0; i < templates.length; i++){
                let {id : templateId, fileNamePattern, searchString, title : templateTitle,  description : templateDescription} = templates[i]
                let operation = fileNamePattern === 'contains' ? 'includes' : fileNamePattern;
                if(fileName[operation](searchString)){ // Matching template FOUND - > this is doing something like this : filename.endsWith('test')
                  let indexOfFileGroup = fileAndTemplates.findIndex(item => item.assetId === templateId && item.file_type === file_type);
                  if(indexOfFileGroup < 0){
                    fileAndTemplates = [...fileAndTemplates, {name : templateTitle, assetId : templateId, relatedTo, title: templateTitle, file_type, description : templateDescription, assetType: 'FileTemplate'}];
                  }
                  return; // Breaking out of inner loop
                }
                
                if(!fileName[operation](searchString) && i === templates.length -1){ // matching template NOT FOUND
                  fileAndTemplates = [...fileAndTemplates, {name: fileName, assetId: fileId, relatedTo, title: fileTitle, isSuperFile, file_type, description: fileDescription, assetType: 'File'}];
                }
              }
        });
          res.send(fileAndTemplates);
          return;
        }
        // END of matching template ------------------
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
        const result = await hpccUtil.getJobWuDetails(clusterId, job.name, dataflowId);
        if (!result.wuid) throw new Error('Could not find WU details by job name');
    
        const jobInfo = await hpccUtil.getJobInfo(clusterId, result.wuid, "Job" );
        const jobfiles = jobInfo?.jobfiles;
        //{ jobfiles: [ { name: 'usa::cars.csv', file_type: 'input' } ] }
        let relatedFiles=[];
        // Check if there were manually added files to job via Input/Output file tabs on frontend and add them to main related files list
        const manuallyAddedFiles = await getManuallyAddedFiles({id:job.id, application_id : applicationId });
        if (manuallyAddedFiles.length > 0) relatedFiles = [...manuallyAddedFiles];

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

  let allAssetsIds = [];

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
  
  // When Synchronizing graph -> Tries to match the files with template again
    // Get all templates
        const templates = await FileTemplate.findAll({
          where: { cluster_id: clusterId, application_id: applicationId },  
        });

        if(templates.length < 1){ // If no templates exists 
          res.json({result, assetsIds: allAssetsIds.flat(Infinity)});
          return;
        }

        let jobsWithRelatedFiles = [];
        let jobWithoutRelatedFiles = [];

        allAssetsIds = [] // resetting the asset all asset ids array -> it will have different items if template is matched
        result.forEach(item => {
          if(item.relatedFiles.length > 0){
            jobsWithRelatedFiles.push(item)
          }else{
            jobWithoutRelatedFiles.push(item);
          }
        })

        jobsWithRelatedFiles.forEach(item =>{
          let {relatedFiles} = item;
          let fileAndTemplates = [];
          relatedFiles.forEach(file => {
            let{name : fileName, assetId: fileId, relatedTo, title : fileTitle, isSuperFile, file_type, description : fileDescription} = file;
            for(let i = 0; i < templates.length; i++){
                let {id : templateId, fileNamePattern, searchString, title : templateTitle,  description : templateDescription} = templates[i]
                let operation = fileNamePattern === 'contains' ? 'includes' : fileNamePattern;
                if(fileName[operation](searchString)){ // Matching template FOUND - > this is doing something like this : filename.endsWith('test')
                  allAssetsIds.push(templateId);
                  let indexOfFileGroup = fileAndTemplates.findIndex(item => item.assetId === templateId && item.file_type === file_type);
                  if(indexOfFileGroup < 0){
                      fileAndTemplates = [...fileAndTemplates, {name : templateTitle, assetId : templateId, relatedTo, title: templateTitle, file_type, description : templateDescription, assetType: 'FileTemplate'}];
                  }
                  return; // Exiting from inner loop when template is found
                }
                if(!fileName[operation](searchString) && i === templates.length -1){ // matching template NOT FOUND
                  allAssetsIds.push(fileId);
                  fileAndTemplates = [...fileAndTemplates, {name: fileName, assetId: fileId, relatedTo, title: fileTitle, isSuperFile, file_type, description: fileDescription, assetType: 'File'}];
                }
              }
          })
          item.relatedFiles = fileAndTemplates;
        })
        const allJobs = [...jobsWithRelatedFiles, ...jobWithoutRelatedFiles];
        res.send({result : allJobs, assetsIds : allAssetsIds})
        
} catch (error) {
  console.log(error);
  return res.status(500).json({ success: false, message: "Error occurred while updating" });
}
});

router.post( '/saveJob',
  [
    body('id').optional({ checkFalsy: true }).isUUID(4).withMessage('Invalid id'),
    body('job.basic.application_id').isUUID(4).withMessage('Invalid application id'),
    body('job.basic.name').matches(/^[a-zA-Z]{1}[a-zA-Z0-9_. \-:]*$/).withMessage('Invalid name'),
    body('job.basic.title').matches(/^[a-zA-Z]{1}[a-zA-Z0-9_. \-:]*$/).withMessage('Invalid title'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    // THIS IS A LIST OF FIELDS WE ARE CURRENTLY GETTING FROM FRONTEND, IF U ADD MORE FIELDS PLEASE UPDATE THIS LIST TOO
    // basic: { name, title, ecl, author, contact, gitRepo, entryBWR, jobType, description, scriptPath, sprayFileName, sprayDropZone, sprayedFileScope, metaData : json{}, cluster_id, dataflowId, application_id, groupId }
    // schedule: { type, jobs, cron}
    // files: []
    // params : []
    // removeAssetId: '' if this value is present we need to delete this asset as it was a design job that was ressign to something else
    // renameAssetId: '' if job was a designer job and it was associated with job that was not on tombolo DB we will rename job instead of deleting it

    const { name, application_id, groupId, dataflowId, cluster_id = null, ...requestJobFields } = req.body.job.basic;
    const {schedule, files, params, removeAssetId='', renameAssetId=''} = req.body.job;
    try {
      // We want to delete design job if it was associated with existing job that is already in Tombolo DB
      if (removeAssetId) await deleteJob(removeAssetId, application_id);
      // We want to update design job if it was associated with HPCC job that was not in Tombolo DB
      if (renameAssetId) await Job.update({name, cluster_id },{where:{id: renameAssetId}});

      // FIND OR CREATE JOB
      let [job, isJobCreated] = await Job.findOrCreate({
        where: { name, application_id, cluster_id },
        defaults: requestJobFields,
      });

      if (!isJobCreated) job = await job.update(requestJobFields);

      // UPDATE OR CREATE AssetsGroups RECORD FOR JOB
      if (groupId){
        const assetGroupsFields = { assetId: job.id, groupId};
        await AssetsGroups.findOrCreate({ where: assetGroupsFields, defaults: assetGroupsFields });
      }
      
      try {
        // Update JobFile table with fresh list of files;
        let jobFiles = await JobFile.findAll({ where: { job_id: job.id, application_id, file_id: { [Op.not]: null } }, order: [['name', 'asc']], raw: true, });      
        //Find files that are removed from the Job and remove them from JobFile table
        if (jobFiles.length > 0 && files.length > 0) {
          const removeIds = jobFiles.reduce((acc, jobFile) => {
            const exist = files.find((fromCluster) => fromCluster.file_type === jobFile.file_type && fromCluster.name === jobFile.name );
            if (!exist) acc.push(jobFile.id);
            return acc;
          }, []);
          if (removeIds.length > 0) await JobFile.destroy({ where: { id: { [Sequelize.Op.in]: removeIds }, application_id } });
        }
        // Find and update or create JobFile.
        for (const file of files) {
          const defaultFields = {
            job_id: job.id,
            application_id,
            name: file.name,
            file_id: file.file_id, // not always present
            file_type: file.file_type,
            added_manually: file.addedManually,
          };
          
          await JobFile.findOrCreate({
            where: { job_id: job.id, application_id, file_type: file.file_type, name: file.name },
            defaults: defaultFields ,
          })
          // If DataFlowId present update assetDataflow table so
          if (dataflowId) await AssetDataflow.findOrCreate({ where: { assetId: job.id, dataflowId }, defaults: { assetId: file.id, dataflowId }, });
        }
        // Update Job Params
        const updateParams = params.map((el) => ({ ...el, job_id: job.id, application_id }));
        await JobParam.destroy({ where: { application_id, job_id: job.id } });
        await JobParam.bulkCreate(updateParams);
      } catch (error) {
        console.log('------------------------------------------');
        console.log('FAILED TO UPDATE JOBFILE AND JOB PARAMS --');
        console.dir(error.message, { depth: null });
        console.log('------------------------------------------');
      }

      // JOB IS SCHEDULED AS 'Predecessor'
      if (schedule.type === 'Predecessor') {
        try {
          // CLEAN UP
          await clearAllPreviousScheduleRecords({ 
            id: job.id,
            name: job.name,
            application_id,
            dataflowId
          });

          const dependentJobsPromises = schedule.jobs.map((dependsOnJobId) =>
            DependentJobs.create({
              jobId: job.id,
              dependsOnJobId,
              dataflowId,
            })
          );
          
         const dependentJobs = await Promise.all(dependentJobsPromises);
          console.log(`-JOB SCHEDULED-Predecessor----------------------------------------`);
          console.dir({dependentJobs:dependentJobs.map(job=> job.toJSON())}, { depth: null });
          console.log('------------------------------------------');

          return res.json({
            success: true,
            jobId: job.id,
            title: job.title,
            jobs: schedule.jobs,
            type: schedule.type,
          });
        } catch (error) {
          console.log('-error- FAILED TO SCHEDULE Predecessor----------------------------------------');
          console.dir({ error }, { depth: null });
          console.log('------------------------------------------');
          return res.status(422).send({ success: false, message: 'Failed to update scheduled job' });
        }
      }

      // JOB IS SCHEDULED AS 'Time'
      if (schedule.type === 'Time') {
        try {
          // CLEAN UP
          await clearAllPreviousScheduleRecords({ 
            id: job.id,
            name: job.name,
            application_id,
            dataflowId
          });

          const { minute, hour, dayMonth, month, dayWeek } = schedule.cron;
          const cronExpression = `${minute} ${hour} ${dayMonth} ${month} ${dayWeek}`;

          const [updatedRow] = await AssetDataflow.update(
            { cron: cronExpression },
            { where: { assetId: job.id, dataflowId } }
          );

          if (!updatedRow) throw new Error('Failed to update AssetDataflow record');

          // ADD JOB TO BREE SCHEDULE
          const getfileName = () => {
            switch (job.jobType) {
              case 'Script':
                return SUBMIT_SCRIPT_JOB_FILE_NAME;
              case 'Manual':
                return SUBMIT_MANUAL_JOB_FILE_NAME;
              default: {
                if (job.isStoredOnGithub) {
                  return SUBMIT_GITHUB_JOB_FILE_NAME;
                } else {
                  return SUBMIT_JOB_FILE_NAME;
                }
              }
            }
          };

          const jobSettings = {
            jobId: job.id,
            jobName: job.name,
            jobfileName: getfileName(),
            title: job.title,
            cron: cronExpression,
            jobType: job.jobType,
            contact: job.contact,
            metaData: job.metaData,
            sprayFileName: job.sprayFileName,
            sprayDropZone: job.sprayFileName,
            sprayedFileScope: job.sprayedFileScope,
            clusterId: job.cluster_id,
            dataflowId,
            applicationId: job.application_id,
          };

          if (jobSettings.jobType === 'Manual') {
            jobSettings.status = 'wait';
            jobSettings.manualJob_meta = {
              jobType: 'Manual',
              jobName: jobSettings.jobName,
              notifiedTo: jobSettings.contact,
              notifiedOn: new Date().getTime(),
            };
          }

          JobScheduler.addJobToScheduler(jobSettings);
          console.log(`-JOB SCHEDULED-Time----------------------------------------`);
          console.dir({jobSettings, job: job.id, jobname:job.name,schedule}, { depth: null });
          console.log('------------------------------------------');
          

          return res.json({
            jobId: job.id,
            success: true,
            title: job.title,
            type: schedule.type,
            cron: schedule.cron,
          });
        } catch (error) {
          console.log('-error- FAILED TO SCHEDULE Time-----------------------------------------');
          console.dir({ error }, { depth: null });
          console.log('------------------------------------------');
          return res.status(422).send({ success: false, message: 'Failed to update scheduled job' });
        }
      }

      // JOB IS SCHEDULED AS 'Message'
      if (schedule.type === 'Message') {
        try {
          // CLEAN UP
          await clearAllPreviousScheduleRecords({ id: job.id, application_id, dataflowId, });
         
          const messageBasedJobsFields = {
            jobId: job.id,
            applicationId: application_id,
            dataflowId,
          };
         
          await MessageBasedJobs.findOrCreate({
            where: messageBasedJobsFields,
            defaults: messageBasedJobsFields,
          });

          return res.json({
            success: true,
            type: req.body.job.schedule.type,
            jobs: req.body.job.schedule.jobs,
            jobId: jobId,
            title: req.body.job.basic.title,
          });
        } catch (error) {
          return res.json({
            success: false,
            message: 'Unable to save job schedule',
          });
        }
      }

      // JOB IS NOT SCHEDULED, we will remove all scheduled records from before.
      if (!schedule.type) {
        try {
          // CLEAN UP
          await clearAllPreviousScheduleRecords({ 
            id: job.id,
            name: job.name,
            application_id,
            dataflowId
          });

          console.log('------------------------------------------');
          console.log(`-JOB SAVED ${job.name}-${job.title}-${job.id}-----------------------------------------`);
          console.log('------------------------------------------');
         
          return res.json({
            success: true,
            type: '',
            jobs: [],
            jobId: job.id,
            title: job.title,
          });
       
        } catch (error) {
          console.log('-error-----------------------------------------');
          console.dir({ error }, { depth: null });
          console.log('------------------------------------------');
          return res.status(422).send({ success: false, message: 'Failed to update scheduled job' });
        }
      }

      // respond default if non of the above triggered
      console.log('-Am I ever Running?-----------------------------------------');
      res.json({ success: true, title: req.body.job.basic.title, jobId: job.id });
      console.log('------------------------------------------');
    } catch (error) {
      console.log('-error- /saveJob----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
      return res.status(422).send({ success: false, message: 'Failed to Save job' });
    }
  }
);

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
    'and (j.cluster_id = (:clusterId) or j.cluster_id is null)'+
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

        // Check if input and output files have matching file templates - wrap in try catch
        const templates = await FileTemplate.findAll({
          where: { cluster_id: job.cluster_id, application_id: req.query.app_id },
        });

        let fileAndTemplates = [];

        job.jobfiles.forEach(file =>{
          let{dataValues : {name : fileName, id: fileId, file_type, description : fileDescription}} = file;
           if(templates.length > 0){
            for(let i = 0; i < templates.length; i++){
              let {id : templateId, fileNamePattern, searchString, title : templateName, description : templateDescription} = templates[i]
              let operation = fileNamePattern === 'contains' ? 'includes' : fileNamePattern;
              if(fileName[operation](searchString)){ // Matching template found
                let indexOfFileGroup = fileAndTemplates.findIndex(item => item.id === templateId && item.file_type === file_type);
                if(indexOfFileGroup >= 0){
                  fileAndTemplates[indexOfFileGroup].files.push({id: fileId, name: fileName, file_type, description: fileDescription, assetType: 'file'})
                }else{
                  fileAndTemplates = [...fileAndTemplates, {id : templateId, name : templateName, file_type, description : templateDescription, assetType: 'fileTemplate',
                                                           files : [{id: fileId, name: fileName, file_type, description: fileDescription, assetType: 'file'}]}];
                }
                return;
              }
              
              if(!fileName[operation](searchString) && i === templates.length -1){ // No matching template found
                fileAndTemplates = [...fileAndTemplates, {id: fileId, name: fileName, file_type, description: fileDescription, assetType: 'file'}];
              }
            }
           }else{
              fileAndTemplates = [...fileAndTemplates, {id: fileId, name: fileName, file_type, description: fileDescription, assetType: 'file'}];
            }
            
        })

        jobData.jobFileTemplate = fileAndTemplates;
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
      await deleteJob(req.body.jobId,req.body.application_id);
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