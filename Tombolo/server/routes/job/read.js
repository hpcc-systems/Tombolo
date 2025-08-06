const express = require('express');
const router = express.Router();
const {
  Job,
  JobFile,
  JobParam,
  File,
  FileValidation,
  FileTemplate,
  DataflowVersion,
  AssetsGroup,
  JobExecution,
  MessageBasedJobs,
} = require('../../models');
let Sequelize = require('sequelize');
const Op = Sequelize.Op;

const JobScheduler = require('../../jobSchedular/job-scheduler');
const hpccUtil = require('../../utils/hpcc-util');
const workFlowUtil = require('../../utils/workflow-util');
const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateJobFileRetention,
  validateSyncDataFlow,
  validateSaveJob,
  validateJobList,
  validateJobDetails,
  validateDeleteJob,
  validateExecuteJob,
  validateJobExecutionDetails,
  validateManualJobResponse,
} = require('../../middlewares/jobMiddleware');
const wildCardStringMatch = require('../../utils/wildCardStringMatch');
const logger = require('../../config/logger');

const SUBMIT_JOB_FILE_NAME = 'submitJob.js';
const SUBMIT_QUERY_PUBLISH = 'submitPublishQuery.js';
const SUBMIT_SPRAY_JOB_FILE_NAME = 'submitSprayJob.js';
const SUBMIT_SCRIPT_JOB_FILE_NAME = 'submitScriptJob.js';
const SUBMIT_MANUAL_JOB_FILE_NAME = 'submitManualJob.js';
const SUBMIT_GITHUB_JOB_FILE_NAME = 'submitGithubJob.js';

const createOrUpdateFile = async ({
  jobfile,
  jobId,
  clusterId,
  applicationId,
  assetGroupId,
}) => {
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
        metaData: { isAssociated: true, ...fileInfo.basic.metaData },
      };

      let [file, isFileCreated] = await File.findOrCreate({
        where: {
          name: fileInfo.basic.name,
          cluster_id: clusterId,
          application_id: applicationId,
        },
        defaults: fileFields,
      });
      if (!isFileCreated) {
        const currentLayout = file.metaData?.layout;
        const incomingLayout = fileInfo.basic?.metaData?.layout;

        if (currentLayout) {
          const updateLayout = syncLayout(currentLayout, incomingLayout);
          if (updateLayout) {
            fileFields.metaData = {
              ...fileFields.metaData,
              layout: updateLayout,
            };
          }
        }

        file = await file.update(fileFields);
      }

      //If group Id provided make entry in asset group table
      if (assetGroupId) {
        const assetGroupsFields = { assetId: file.id, groupId: assetGroupId };
        await AssetsGroup.findOrCreate({
          where: assetGroupsFields,
          defaults: assetGroupId,
        });
      }

      // updateCommonData
      const fileValidations = fileInfo.file_validations.map(el => ({
        ...el,
        file_id: file.id,
        application_id: file.application_id,
      }));

      // create FileValidation
      await FileValidation.bulkCreate(fileValidations, {
        updateOnDuplicate: ['name', 'ruleType', 'rule', 'action', 'fixScript'],
      });

      const jobfileFields = {
        name: file.name,
        file_id: file.id,
        file_type: jobfile.file_type,
        description: file.description,
        isSuperFile: jobfile.isSuperFile,
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

      // construct object with fields that is going to be used to create a graph nodes
      const relatedFile = {
        name: file.name,
        assetId: file.id,
        relatedTo: jobId,
        title: file.title,
        isAssociated: true,
        isSuperFile: file.isSuperFile,
        file_type: jobfile.file_type, //'input' | 'output'
        description: file.description,
      };
      // ADD FILE TO RELATED FILE LIST
      return relatedFile;
    }
  } catch (error) {
    logger.error(error);
    return null;
  }
};

const syncLayout = (currentLayout, incomingLayout) => {
  if (!Array.isArray(currentLayout) || !Array.isArray(incomingLayout))
    return null;

  const newLayout = incomingLayout.reduce((acc, el, index) => {
    const exists = currentLayout.find(current => current.name === el.name);
    const field = exists || el;
    acc.push({ ...field, id: index });
    return acc;
  }, []);

  return newLayout;
};

const deleteJob = async (jobId, application_id) => {
  return await Promise.all([
    Job.destroy({ where: { id: jobId, application_id } }),
    JobScheduler.removeAllFromBree(jobId),
    JobFile.destroy({ where: { job_id: jobId } }),
    JobParam.destroy({ where: { job_id: jobId } }),
  ]);
};

const getManuallyAddedFiles = async job => {
  const manuallyAddedJobs = [];
  // Check if there were manually added files to job via Input/Output file tabs on frontend and add them to main related files list
  const manuallyAddedFiles = await JobFile.findAll({
    where: {
      job_id: job.id,
      application_id: job.application_id,
      added_manually: true,
      file_id: { [Op.not]: null },
    },
  });

  if (manuallyAddedFiles.length > 0) {
    for (const el of manuallyAddedFiles) {
      const file = await File.findOne({ where: { id: el.file_id } });
      if (file) {
        manuallyAddedJobs.push({
          name: file.name,
          assetId: file.id,
          relatedTo: job.id,
          title: file.title,
          isSuperFile: file.isSuperFile,
          file_type: el.file_type, //'input' | 'output'
          description: file.description,
          isAssociated: file.metaData ? file.metaData.isAssociated : true, // prev created files will have metadata as null, all prev files are associated files!
        });
      }
    }
  }
  return manuallyAddedJobs;
};

router.post(
  '/jobFileRelation',
  validate(validateJobFileRetention),
  async (req, res) => {
    const { dataflowId } = req.body;
    try {
      const job = await Job.findOne({ where: { id: req.body.jobId } });
      if (!job) throw new Error('Job does not exist');

      const assetGroup = await AssetsGroup.findOne({
        where: { assetId: job.id },
      });

      const result = await hpccUtil.getJobWuDetails(
        job.cluster_id,
        job.name,
        dataflowId
      );
      if (!result.wuid)
        throw new Error('Could not find WU details by job name');

      const jobInfo = await hpccUtil.getJobInfo(
        job.cluster_id,
        result.wuid,
        job.jobType
      );
      const jobfiles = jobInfo?.jobfiles;

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
          const duplicateFile = relatedFiles.find(
            file => file.name === jobfile.name
          );

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

            if (!isJobFileCreated)
              jobFile = await jobFile.update(jobfileFields);
            relatedFiles.push({
              ...duplicateFile,
              file_type: jobfile.file_type,
            });
          } else {
            // create or update JobFile relationship
            const file = await createOrUpdateFile({
              dataflowId,
              jobId: job.id,
              jobfile: jobfile,
              clusterId: job.cluster_id,
              applicationId: job.application_id,
              assetGroupId: assetGroup ? assetGroup.groupId : '',
            });
            if (file) {
              relatedFiles.push(file);
            }
          }
        }
      }
      // START of matching template ------------------
      const templates = await FileTemplate.findAll({
        where: {
          cluster_id: job.cluster_id,
          application_id: job.application_id,
        },
      });

      if (templates.length > 0) {
        let fileAndTemplates = [];
        relatedFiles.forEach(file => {
          let {
            name: fileName,
            assetId: fileId,
            relatedTo,
            title: fileTitle,
            isSuperFile,
            isAssociated,
            file_type,
            description: fileDescription,
          } = file;
          for (let i = 0; i < templates.length; i++) {
            let {
              id: templateId,
              fileNamePattern,
              searchString,
              title: templateTitle,
              description: templateDescription,
            } = templates[i];
            const foundMatchingTemplate = wildCardStringMatch(
              searchString,
              fileName
            );
            if (foundMatchingTemplate) {
              // Matching template FOUND - > this is doing something like this : filename.endsWith('test')
              let indexOfFileGroup = fileAndTemplates.findIndex(
                item =>
                  item.assetId === templateId && item.file_type === file_type
              );
              if (indexOfFileGroup < 0) {
                fileAndTemplates = [
                  ...fileAndTemplates,
                  {
                    name: templateTitle,
                    isAssociated: true,
                    assetId: templateId,
                    relatedTo,
                    title: templateTitle,
                    file_type,
                    description: templateDescription,
                    assetType: 'FileTemplate',
                  },
                ];
              }
              return; // Breaking out of inner loop
            }

            if (!foundMatchingTemplate && i === templates.length - 1) {
              // matching template NOT FOUND
              fileAndTemplates = [
                ...fileAndTemplates,
                {
                  name: fileName,
                  assetId: fileId,
                  relatedTo,
                  title: fileTitle,
                  isSuperFile,
                  isAssociated,
                  file_type,
                  description: fileDescription,
                  assetType: 'File',
                },
              ];
            }
          }
        });
        return res.status(200).send(fileAndTemplates);
      }
      // END of matching template ------------------
      return res.status(200).send(relatedFiles);
    } catch (error) {
      logger.error('-error /jobFileRelation--------------------------------');
      logger.error(error);
      logger.error('------------------------------------------');
      return res.status(500).send('Could not find related files');
    }
  }
);

router.post(
  '/syncDataflow',
  validate(validateSyncDataFlow),
  async (req, res) => {
    // {
    //   applicationId: 'e06563e9-9490-4940-a737-bad9a5a765ee',
    //   dataflowId: '898a568d-9fed-4464-bf94-8a4609f198cd',
    //   clusterId: 'd399a40a-e2b3-4b65-9804-266ef2031cee',
    //   jobList: [
    //     { id: '708da72c-2d96-4066-be64-86e8342432cc', name: 'getCars.ecl' }
    //   ]
    try {
      const { applicationId, dataflowId, clusterId, jobList } = req.body;

      const filesPromises = [];

      for (const job of jobList) {
        const getFiles = new Promise(async (resolve, reject) => {
          try {
            const result = await hpccUtil.getJobWuDetails(
              clusterId,
              job.name,
              dataflowId
            );
            if (!result.wuid)
              throw new Error('Could not find WU details by job name');

            const jobInfo = await hpccUtil.getJobInfo(
              clusterId,
              result.wuid,
              'Job'
            );
            const jobfiles = jobInfo?.jobfiles;
            //{ jobfiles: [ { name: 'usa::cars.csv', file_type: 'input' } ] }
            let relatedFiles = [];
            // Check if there were manually added files to job via Input/Output file tabs on frontend and add them to main related files list
            const manuallyAddedFiles = await getManuallyAddedFiles({
              id: job.id,
              application_id: applicationId,
            });
            if (manuallyAddedFiles.length > 0)
              relatedFiles = [...manuallyAddedFiles];

            if (jobfiles?.length > 0) {
              for (const jobfile of jobfiles) {
                const assetGroup = await AssetsGroup.findOne({
                  where: { assetId: job.id },
                });
                const file = await createOrUpdateFile({
                  jobId: job.id,
                  applicationId,
                  dataflowId,
                  clusterId,
                  jobfile,
                  assetGroupId: assetGroup ? assetGroup.groupId : '',
                });
                if (file) {
                  relatedFiles.push(file);
                }
              }
            }
            resolve({ job: job.id, relatedFiles });
          } catch (error) {
            logger.error(error);
            reject();
          }
        });

        filesPromises.push(getFiles);
      }

      const settled = await Promise.allSettled(filesPromises);

      const result = settled.reduce((acc, el) => {
        if (el.status === 'fulfilled') {
          acc.push(el.value);
        }
        return acc;
      }, []);

      let allAssetsIds = [];

      // Delete JobFile record if file is not associated anymore
      if (result.length > 0) {
        for (const record of result) {
          if (record.relatedFiles.length > 0) {
            const filesIds = record.relatedFiles.map(file => file.assetId);
            allAssetsIds.push(filesIds);
            try {
              const deleted = await JobFile.destroy({
                where: {
                  job_id: record.job,
                  application_id: applicationId,
                  file_id: {
                    [Op.not]: filesIds,
                  },
                },
              });
              logger.info('syncDataFlow deleted: ', deleted);
            } catch (error) {
              logger.error(error);
            }
          }
        }
      }

      // When Synchronizing graph -> Tries to match the files with template again
      // Get all templates
      const templates = await FileTemplate.findAll({
        where: { cluster_id: clusterId, application_id: applicationId },
        raw: true,
      });

      if (templates.length < 1) {
        // If no templates exists
        return res.json({ result, assetsIds: allAssetsIds.flat(Infinity) });
      }

      let jobWithoutRelatedFiles = []; // Has no input or output files
      let jobsWithRelatedFiles = []; // Has input or output files

      allAssetsIds = []; // resetting the asset all asset ids array -> it will have different items if template is matched
      // Push job to respective array based on if they have related files or not
      result.forEach(item => {
        if (item.relatedFiles.length > 0) {
          jobsWithRelatedFiles.push(item);
        } else {
          jobWithoutRelatedFiles.push(item);
        }
      });

      let fileAndTemplates = [];
      jobsWithRelatedFiles.forEach(jobWithRelatedFiles => {
        let { relatedFiles, job: jobId } = jobWithRelatedFiles;
        relatedFiles.forEach(file => {
          let {
            name: fileName,
            assetId: fileId,
            relatedTo,
            title: fileTitle,
            isSuperFile,
            isAssociated,
            file_type,
            description: fileDescription,
          } = file;
          for (let i = 0; i < templates.length; i++) {
            let {
              id: templateId,
              fileNamePattern,
              searchString,
              title: templateTitle,
              description: templateDescription,
            } = templates[i];
            let foundMatchingTemplate = wildCardStringMatch(
              searchString,
              fileName
            );
            if (foundMatchingTemplate) {
              allAssetsIds.push(templateId);
              let indexOfFileGroup = fileAndTemplates.findIndex(
                fileAndTemplate =>
                  fileAndTemplate.assetId === templateId &&
                  fileAndTemplate.file_type === file_type
              );
              if (indexOfFileGroup < 0) {
                fileAndTemplates = [
                  ...fileAndTemplates,
                  {
                    name: templateTitle,
                    isAssociated: true,
                    assetId: templateId,
                    relatedTo,
                    title: templateTitle,
                    file_type,
                    description: templateDescription,
                    assetType: 'FileTemplate',
                  },
                ];
              }
              return; // Exiting from inner loop when template is found
            }
            if (!foundMatchingTemplate && i === templates.length - 1) {
              // matching template not found && completed lopping all templates
              allAssetsIds.push(fileId);
              fileAndTemplates = [
                ...fileAndTemplates,
                {
                  name: fileName,
                  assetId: fileId,
                  relatedTo,
                  title: fileTitle,
                  isSuperFile,
                  isAssociated,
                  file_type,
                  description: fileDescription,
                  assetType: 'File',
                },
              ];
            }
          }
        });
        jobWithRelatedFiles.relatedFiles = fileAndTemplates;
      });
      const allJobs = [...jobsWithRelatedFiles, ...jobWithoutRelatedFiles];
      return res.status(200).send({ result: allJobs, assetsIds: allAssetsIds });
    } catch (error) {
      logger.error(error);
      return res
        .status(500)
        .json({ success: false, message: 'Error occurred while updating' });
    }
  }
);

router.post('/saveJob', validate(validateSaveJob), async (req, res) => {
  // THIS IS A LIST OF FIELDS WE ARE CURRENTLY GETTING FROM FRONTEND, IF U ADD MORE FIELDS PLEASE UPDATE THIS LIST TOO
  // basic: { name, title, ecl, author, contact, gitRepo, entryBWR, jobType, description, scriptPath, sprayFileName, sprayDropZone, sprayedFileScope, metaData : json{}, cluster_id , application_id, groupId }
  // files: []
  // params : []
  // removeAssetId: '' if this value is present we need to delete this asset as it was a design job that was ressign to something else
  // renameAssetId: '' if job was a designer job and it was associated with job that was not on tombolo DB we will rename job instead of deleting it

  const {
    name,
    application_id,
    groupId,
    cluster_id = null,
    ...requestJobFields
  } = req.body.job.basic;
  const {
    files,
    params,
    removeAssetId = '',
    renameAssetId = '',
  } = req.body.job;
  try {
    // We want to delete design job if it was associated with existing job that is already in Tombolo DB
    if (removeAssetId) await deleteJob(removeAssetId, application_id);
    // We want to update design job if it was associated with HPCC job that was not in Tombolo DB
    if (renameAssetId)
      await Job.update({ name, cluster_id }, { where: { id: renameAssetId } });

    // FIND OR CREATE JOB
    let [job, isJobCreated] = await Job.findOrCreate({
      where: { name, application_id, cluster_id },
      defaults: requestJobFields,
    });

    if (!isJobCreated) job = await job.update(requestJobFields);

    // UPDATE OR CREATE AssetsGroup RECORD FOR JOB
    if (groupId) {
      const assetGroupsFields = { assetId: job.id, groupId };
      await AssetsGroup.findOrCreate({
        where: assetGroupsFields,
        defaults: assetGroupsFields,
      });
    }

    try {
      // Update JobFile table with fresh list of files;
      let jobFiles = await JobFile.findAll({
        where: {
          job_id: job.id,
          application_id,
          file_id: { [Op.not]: null },
        },
        order: [['name', 'asc']],
        raw: true,
      });
      //Find files that are removed from the Job and remove them from JobFile table
      if (jobFiles.length > 0 && files.length > 0) {
        const removeIds = jobFiles.reduce((acc, jobFile) => {
          const exist = files.find(
            fromCluster =>
              fromCluster.file_type === jobFile.file_type &&
              fromCluster.name === jobFile.name
          );
          if (!exist) acc.push(jobFile.id);
          return acc;
        }, []);
        if (removeIds.length > 0)
          await JobFile.destroy({
            where: { id: { [Sequelize.Op.in]: removeIds }, application_id },
          });
      }
      // Find and update or create JobFile.
      for (const file of files) {
        const defaultFields = {
          job_id: job.id,
          application_id,
          name: file.name,
          file_id: file.file_id, // not always present
          file_type: file.file_type,
          isSuperFile: file.isSuperFile,
          added_manually: file.addedManually,
        };

        await JobFile.findOrCreate({
          where: {
            job_id: job.id,
            application_id,
            file_type: file.file_type,
            name: file.name,
          },
          defaults: defaultFields,
        });
      }
      // Update Job Params
      const updateParams = params.map(el => ({
        ...el,
        job_id: job.id,
        application_id,
      }));
      await JobParam.destroy({ where: { application_id, job_id: job.id } });
      await JobParam.bulkCreate(updateParams);
    } catch (error) {
      logger.error('FAILED TO UPDATE JOBFILE AND JOB PARAMS --');
      logger.error(error);
      logger.error('------------------------------------------');
    }

    logger.info(`---JOB SAVED ${job.name}-${job.title}-${job.id}-----------`);

    return res.status(200).json({
      success: true,
      title: req.body.job.basic.title,
      jobId: job.id,
    });
  } catch (error) {
    logger.error('-error- /saveJob----------------------------------------');
    logger.error(error);
    logger.error('------------------------------------------');
    return res
      .status(422)
      .send({ success: false, message: 'Failed to Save job' });
  }
});

router.get('/job_list', validate(validateJobList), async (req, res) => {
  try {
    const { application_id, cluster_id } = req.query;
    const assets = await Job.findAll({
      where: {
        application_id,
        [Op.or]: [{ cluster_id }, { cluster_id: null }],
      },
      attributes: [
        'id',
        'name',
        'title',
        'jobType',
        'metaData',
        'description',
        'createdAt',
      ],
    });

    const assetList = assets.map(asset => {
      const parsed = asset.toJSON();
      parsed.isAssociated = asset.metaData?.isAssociated || false;
      delete parsed.metaData;
      return parsed;
    });

    return res.status(200).json(assetList);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error occurred while retrieving assets',
    });
  }
});

router.get('/job_details', validate(validateJobDetails), async (req, res) => {
  try {
    Job.findOne({
      where: { application_id: req.query.app_id, id: req.query.job_id },
      include: [JobParam, JobExecution],
      attributes: { exclude: ['assetId'] },
    })
      .then(async function (job) {
        if (job) {
          let jobfiles = await JobFile.findAll(
            { where: { job_id: job.id } },
            { raw: true }
          );
          job.jobfiles = jobfiles || [];
          const isStoredOnGithub = job?.metaData?.isStoredOnGithub;
          const jobStatus = job.job_executions?.[0]?.status;

          //Among the job files find which ones are super files
          const filesIds = job.jobfiles.map(jf => jf.file_id);
          const superFiles = await File.findAll({
            where: { id: filesIds, isSuperFile: true },
          });
          const superFileIds = superFiles.map(file => file.id);
          if (
            isStoredOnGithub &&
            (jobStatus === 'completed' || jobStatus === 'failed')
          ) {
            const wuid = job.job_executions[0].wuid;
            try {
              const hpccJobInfo = await hpccUtil.getJobInfo(
                job.cluster_id,
                wuid,
                job.jobType
              );
              // #1 create JobFiles
              //change to create or updated
              hpccJobInfo.jobfiles.forEach(async file => {
                // create or update JobFile relationship
                const jobfileFields = {
                  job_id: job.id,
                  name: file.name,
                  file_type: file.file_type,
                  application_id: job.application_id,
                };

                await JobFile.findOrCreate({
                  where: jobfileFields,
                  defaults: jobfileFields,
                });
              });

              job.set('ecl', hpccJobInfo.ecl);
              await job.save();
            } catch (error) {
              logger.error(`FAILED TO UPDATE ECL FOR "${job.name}"`);
              logger.error(error);
              logger.error('------------------------------------------');
            }
          }

          var jobData = job.get({ plain: true });
          jobfiles = await JobFile.findAll(
            { where: { job_id: job.id } },
            { raw: true }
          );
          jobData.jobfiles = jobfiles || [];

          for (const jobFileIdx in jobData.jobfiles) {
            var jobFile = jobData.jobfiles[jobFileIdx];
            var file = await File.findOne({
              where: {
                application_id: req.query.app_id,
                id: jobFile.file_id,
              },
            });
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
            let messageBasedJobs = await MessageBasedJobs.findAll({
              where: {
                jobId: req.query.job_id,
                dataflowId: req.query.dataflow_id,
                applicationId: req.query.app_id,
              },
            });

            if (messageBasedJobs.length > 0) {
              jobData.schedule = {
                type: 'Message',
              };
            }
          }

          // Check if input and output files have matching file templates
          const templates = await FileTemplate.findAll({
            where: {
              cluster_id: job.cluster_id,
              application_id: req.query.app_id,
            },
          });

          let fileAndTemplates = [];

          // If file template length > 0
          job.jobfiles.forEach(file => {
            let {
              dataValues: { name: fileName, file_type },
            } = file;
            let { dataValues: newFileObj } = file;
            if (superFileIds.includes(file.file_id))
              newFileObj.isSuperFile = true; // adds super file property
            newFileObj.assetType = newFileObj.isSuperFile
              ? 'Super File'
              : 'Logical File'; // Add assetType property
            if (templates.length === 0) {
              fileAndTemplates.push(newFileObj);
            } else {
              for (let i = 0; i < templates.length; i++) {
                let {
                  id: templateId,
                  fileNamePattern,
                  searchString,
                  title: templateName,
                  description: templateDescription,
                } = templates[i];
                // let operation = fileNamePattern === 'contains' ? 'includes' : fileNamePattern;
                const foundMatchingTemplate = wildCardStringMatch(
                  searchString,
                  fileName
                );
                if (foundMatchingTemplate) {
                  // Matching template found
                  let indexOfFileGroup = fileAndTemplates.findIndex(
                    item =>
                      item.id === templateId && item.file_type === file_type
                  );
                  if (indexOfFileGroup >= 0) {
                    fileAndTemplates[indexOfFileGroup].files.push(newFileObj);
                  } else {
                    fileAndTemplates = [
                      ...fileAndTemplates,
                      {
                        id: templateId,
                        name: templateName,
                        file_type,
                        description: templateDescription,
                        assetType: 'File Template',
                        files: [newFileObj],
                      },
                    ];
                  }
                  return;
                }

                if (!foundMatchingTemplate && i === templates.length - 1) {
                  // No matching template found
                  fileAndTemplates = [...fileAndTemplates, newFileObj];
                }
              }
            }
          });
          jobData.jobFileTemplate = fileAndTemplates;
          return jobData;
        } else {
          return res.status(500).json({
            success: false,
            message:
              'Job details could not be found. Please check if the job exists in Assets. ',
          });
        }
      })
      .then(function (jobData) {
        res.json(jobData);
      })
      .catch(function (err) {
        logger.error(err);
      });
  } catch (err) {
    logger.error(err);
  }
});

router.post('/delete', validate(validateDeleteJob), async (req, res) => {
  try {
    await deleteJob(req.body.jobId, req.body.application_id);
    return res.status(200).json({ result: 'success' });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error occurred while deleting the job',
    });
  }
});

router.post('/executeJob', validate(validateExecuteJob), async (req, res) => {
  try {
    const job = await Job.findOne({
      where: { id: req.body.jobId },
      attributes: { exclude: ['assetId'] },
      include: [JobParam],
    });

    let status;

    const isSprayJob = job.jobType == 'Spray';
    const isScriptJob = job.jobType == 'Script';
    const isManualJob = job.jobType === 'Manual';
    const isQueryPublishJob = job.jobType === 'Query Publish';
    const isGitHubJob = job.metaData?.isStoredOnGithub;

    const commonWorkerData = {
      dataflowVersionId: req.body.dataflowVersionId,
      applicationId: req.body.applicationId,
      dataflowId: req.body.dataflowId,
      clusterId: req.body.clusterId,
      jobName: req.body.jobName,
      jobId: req.body.jobId,
      jobType: job.jobType,
      title: job.title,
    };

    if (isSprayJob) {
      status = JobScheduler.executeJob({
        jobfileName: SUBMIT_SPRAY_JOB_FILE_NAME,
        ...commonWorkerData,
        sprayedFileScope: job.sprayedFileScope,
        sprayFileName: job.sprayFileName,
        sprayDropZone: job.sprayDropZone,
      });
    } else if (isScriptJob) {
      status = JobScheduler.executeJob({
        jobfileName: SUBMIT_SCRIPT_JOB_FILE_NAME,
        ...commonWorkerData,
      });
    } else if (isManualJob) {
      status = JobScheduler.executeJob({
        jobfileName: SUBMIT_MANUAL_JOB_FILE_NAME,
        ...commonWorkerData,
        status: 'wait',
        manualJob_meta: {
          jobType: 'Manual',
          jobName: job.name,
          notifiedTo: job.contact,
          notifiedOn: new Date().getTime(),
        },
      });
    } else if (isGitHubJob) {
      status = JobScheduler.executeJob({
        jobfileName: SUBMIT_GITHUB_JOB_FILE_NAME,
        ...commonWorkerData,
        metaData: job.metaData,
      });
    } else if (isQueryPublishJob) {
      status = JobScheduler.executeJob({
        jobfileName: SUBMIT_QUERY_PUBLISH,
        ...commonWorkerData,
      });
    } else {
      status = JobScheduler.executeJob({
        jobfileName: SUBMIT_JOB_FILE_NAME,
        ...commonWorkerData,
      });
    }

    if (!status.success) throw status;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('err', err);
    return res.status(500).json({
      success: false,
      message: 'Error occured while submiting the job',
    });
  }
});

router.get(
  '/jobExecutionDetails',
  validate(validateJobExecutionDetails),
  async (req, res) => {
    try {
      const jobExecutions = await JobExecution.findAll({
        where: {
          dataflowId: req.query.dataflowId,
          applicationId: req.query.applicationId,
        },
        include: [
          {
            model: Job,
            attributes: ['name', 'jobType'],
            paranoid: false, // will pull softDeleted Records
          },
          {
            model: DataflowVersion,
            attributes: ['name', 'isLive'],
            paranoid: false, // will pull softDeleted Records
          },
        ],
      });

      const formatted = jobExecutions.map(je => ({
        // this is the way frontend is expecting this data to come
        id: je.id,
        task: je.jobId,
        wuid: je.wuid,
        name: je.job.name,
        status: je.status,
        jobType: je.job.jobType,
        updatedAt: je.updatedAt,
        createdAt: je.createdAt,
        wu_end: je.wu_end,
        wu_start: je.wu_start,
        wu_duration: je.wu_duration,
        manualJob_meta: je.manualJob_meta,
        jobExecutionGroupId: je.jobExecutionGroupId,
        clusterId: je.clusterId,
        dataflowId: je.dataflowId,
        applicationId: je.applicationId,
        dataflowVersion: {
          name: je.dataflow_version?.name || '',
          isLive: je.dataflow_version?.isLive,
        },
      }));

      return res.json(formatted);
    } catch (err) {
      console.error('err', err);
      return res.status(500).json({
        success: false,
        message: 'Error occured while retrieving Job Execution Details',
      });
    }
  }
);

//when user responds to a manual job - Update job status and metadata on job execution table
router.post(
  '/manualJobResponse',
  validate(validateManualJobResponse),
  async (req, res) => {
    const { jobExecutionId, status, manualJob_metadata } = req.body;
    let jobExecution;
    try {
      jobExecution = await JobExecution.findOne({
        where: { id: jobExecutionId },
      });
      const newJobExecutionMetaData = {
        ...jobExecution.manualJob_meta,
        ...manualJob_metadata,
      };
      await jobExecution.update({
        status,
        manualJob_meta: newJobExecutionMetaData,
      });

      res.status(200).json({ success: true, message: 'Job execution updated' }); // Response to client if no error
    } catch (error) {
      logger.error('-- Update manual job metadata -------------');
      logger.error(error);
      logger.error('-------------------------------------------');
      return res
        .status(501)
        .json({ success: false, message: 'Error occurred while saving data' }); // response to client when error and return
    }

    // Once response is recorded successfully check for dependent job & send confirmation email
    try {
      if (status === 'completed') {
        //Checks for dependent job
        await JobScheduler.scheduleCheckForJobsWithSingleDependency({
          dependsOnJobId: jobExecution.jobId,
          dataflowId: jobExecution.dataflowId,
          jobExecutionGroupId: jobExecution.jobExecutionGroupId,
        });
      }
      await workFlowUtil.confirmationManualJobAction(
        jobExecution.manualJob_meta
      ); // Sends confirmation email
    } catch (error) {
      logger.error('-Manual job confirmation & dependent job checking -----');
      logger.error(error);
      logger.error('-------------------------------------------------------');
    }
  }
);

module.exports = router;
