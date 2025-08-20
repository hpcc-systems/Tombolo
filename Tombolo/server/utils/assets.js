const {
  File,
  FileMonitoring,
  FileTemplate,
  FileValidation,
  Group,
  Query,
  QueryField,
  IndexKey,
  IndexPayload,
  Job,
  JobFile,
  JobParam,
  ConsumerObject,
  JobExecution,
  Indexes: Index,
  sequelize,
} = require('../models');

const hpccUtil = require('./hpcc-util');
const workflowUtil = require('./workflow-util');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const JobScheduler = require('../jobSchedular/job-scheduler');
const { Op } = require('sequelize');
const logger = require('../config/logger');

const SUBMIT_JOB_FILE_NAME = 'submitJob.js';
const SUBMIT_SCRIPT_JOB_FILE_NAME = 'submitScriptJob.js';
const SUBMIT_MANUAL_JOB_FILE_NAME = 'submitManualJob.js';
const SUBMIT_GITHUB_JOB_FILE_NAME = 'submitGithubJob.js';

exports.fileInfo = async (applicationId, file_id) => {
  try {
    const results = { basic: {} };

    let file = await File.findOne({
      where: { application_id: applicationId, id: file_id },
      include: [{ model: Group, as: 'groups' }],
    });

    // if fields are empty, try to fetch them again;
    let layout = file?.metaData?.layout || [];

    if (layout.length === 0) {
      //for some reason, if file layout is empty, fetch it from hpcc and save it to db
      const fileInfo = await hpccUtil.fileInfo(file.name, file.cluster_id);
      if (fileInfo) {
        const newMetaData = {
          ...file?.metaData,
          layout: fileInfo.basic.metaData.layout,
        };
        file = await file.update({ metaData: newMetaData });
      }
    }
    // file data with fields and everything will be in basic.
    results.basic = file.toJSON();

    if (file.isSuperFile) {
      try {
        const DFUService = await hpccUtil.getDFUService(file.cluster_id);
        const response = await DFUService.DFUInfo({ Name: file.name });

        if (!response.FileDetail) throw new Error('File details not found');

        results.basic.superFileData = {
          error: '',
          subFiles: response.FileDetail.subfiles.Item,
          recordCount: response.FileDetail.RecordCount,
          fileSize: response.FileDetail.Filesize,
          fileSizeInt64: response.FileDetail.FileSizeInt64,
        };
      } catch (error) {
        logger.error('assets DFUInfo: ', error);
        results.basic.superFileData = {
          error: error.message,
        };
      }
    }

    const fileValidations = await FileValidation.findAll({
      where: { application_id: applicationId, file_id: file_id },
    });

    results.file_validations = fileValidations.filter(
      item => item.name != '__fileposition__'
    );

    const fileConsumers = await ConsumerObject.findAll({
      where: { object_id: file_id, object_type: 'file' },
    });
    results.consumers = fileConsumers;

    return results;
  } catch (error) {
    logger.error('Error occurred while retrieving file details" :>> ', error);
    throw error;
  }
};

exports.fileSearch = async (applicationId, keyword) => {
  try {
    let query =
      // eslint-disable-next-line quotes
      "select f.id, f.name, f.title, f.cluster_id, f.description, f.createdAt, 'File' as type from file f where f.application_id = (:applicationId) and f.deletedAt IS NULL and (f.name REGEXP (:keyword) or f.title REGEXP (:keyword)) ";
    let replacements = { applicationId: applicationId, keyword: keyword };

    const files = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
      replacements: replacements,
    });

    return files || [];
  } catch (err) {
    logger.error('utils/assets - fileSearch: ', err);
    throw err;
  }
};

exports.indexInfo = async (applicationId, indexId) => {
  let results = {};
  try {
    const index = await Index.findOne({
      where: { application_id: applicationId, id: indexId },
      include: [
        { model: IndexKey },
        { model: IndexPayload },
        { model: Group, as: 'groups' },
      ],
    });
    results.basic = index;
    return results;
  } catch (err) {
    logger.error('utils/assets - indexInfo: ', err);
    throw err;
  }
};

exports.queryInfo = async (applicationId, indexId) => {
  let results = {};
  try {
    const query = await Query.findOne({
      where: { application_id: applicationId, id: indexId },
      include: [{ model: QueryField }, { model: Group, as: 'groups' }],
    });
    results.basic = query;
    return results;
  } catch (err) {
    logger.error('utils/assets - queryInfo: ', err);
    throw err;
  }
};

exports.jobInfo = async (applicationId, jobId) => {
  try {
    const job = await Job.findOne({
      where: { application_id: applicationId, id: jobId },
      attributes: [
        'id',
        'description',
        'title',
        'name',
        'author',
        'contact',
        'ecl',
        'entryBWR',
        'gitRepo',
        'jobType',
        'cluster_id',
        'metaData',
      ],
      include: [JobParam],
    });

    let jobData = job.get({ plain: true });
    const jobfiles = await JobFile.findAll(
      { where: { job_id: job.id } },
      { raw: true }
    );
    jobData.jobfiles = jobfiles || [];

    for (const jobFileIdx in jobData.jobfiles) {
      var jobFile = jobData.jobfiles[jobFileIdx];
      var file = await File.findOne({
        where: { application_id: applicationId, id: jobFile.file_id },
      });
      if (file != undefined) {
        jobFile.description = file.description;
        //jobFile.groupId = file.groupId;
        jobFile.title = file.title;
        jobFile.name = file.name;
        jobFile.fileType = file.fileType;
        jobFile.qualifiedPath = file.qualifiedPath;
        jobData.jobfiles[jobFileIdx] = jobFile;
      }
    }
    return jobData;
  } catch (err) {
    logger.error('utils/assets - jobInfo: ', err);
    throw err;
  }
};

exports.executeScriptJob = jobId => {
  try {
    return new Promise(async (resolve, reject) => {
      let scriptJob = await Job.findOne({
        where: { id: jobId },
        attributes: { exclude: ['assetId'] },
      });
      let scriptName =
        scriptJob.scriptPath && scriptJob.scriptPath.indexOf(' ') != -1
          ? scriptJob.scriptPath.substr(0, scriptJob.scriptPath.indexOf(' '))
          : scriptJob.scriptPath;
      let scriptParams =
        scriptJob.scriptPath && scriptJob.scriptPath.indexOf(' ') != -1
          ? scriptJob.scriptPath.substr(scriptJob.scriptPath.indexOf(' ') + 1)
          : '';
      let scriptPath = path.join(__dirname, '../scripts', scriptName),
        scriptRootFolder = path.dirname(scriptPath);
      let cmd = process.platform == 'win32' ? 'cmd.exe' : 'sh';
      execFile(
        cmd,
        [scriptPath, scriptParams],
        { cwd: scriptRootFolder },
        (err, stdout, stderr) => {
          logger.error(stdout);
          if (err) {
            reject(err);
          }
          if (stderr) {
            reject(stderr);
          }
          resolve(stdout);
        }
      );
    });
  } catch (err) {
    return Promise.reject(err);
  }
};

//The only job of recordJobExecution func is to add the job execution record.
//Update in Job execution status is done through status poller
exports.recordJobExecution = async (workerData, wuid) => {
  try {
    const result = await JobExecution.create({
      jobId: workerData.jobId,
      dataflowId: workerData.dataflowId || null,
      dataflowVersionId: workerData.dataflowVersionId,
      applicationId: workerData.applicationId,
      wuid: wuid,
      clusterId: workerData.clusterId,
      status: workerData.status,
      jobExecutionGroupId: workerData.jobExecutionGroupId,
      manualJob_meta: workerData.manualJob_meta,
    });

    return result.dataValues.id;
  } catch (err) {
    logger.error('utils/assets - recordJobExecution: ', err);
    throw err;
  }
};

exports.createFilesandJobfiles = async ({
  file,
  cluster_id,
  application_id,
  id,
}) => {
  try {
    const fileInfo = await hpccUtil.fileInfo(file.name, cluster_id);
    if (!fileInfo) throw new Error('Failed to get File Info');
    const fileCreated = await File.create({
      description: fileInfo.basic.description,
      isSuperFile: fileInfo.basic.isSuperfile,
      qualifiedPath: fileInfo.basic.pathMask,
      fileType: fileInfo.basic.fileType,
      application_id: application_id,
      title: fileInfo.basic.fileName,
      scope: fileInfo.basic.scope,
      name: fileInfo.basic.name,
      cluster_id: cluster_id,
      dataflowId: '',
    });
    // #2 create JobFile;
    await JobFile.create({
      application_id: application_id,
      name: fileInfo.basic.name,
      file_type: file.file_type,
      file_id: fileCreated.id,
      job_id: id,
    });
  } catch (error) {
    logger.error('utils/assets - createFilesandJobfiles:', error);
    throw error;
  }
};

exports.createGithubFlow = async ({
  jobId,
  jobName,
  gitHubFiles,
  dataflowId,
  dataflowVersionId,
  applicationId,
  clusterId,
  jobExecutionGroupId,
}) => {
  let jobExecution, tasks;
  try {
    // # create Job Execution with status 'cloning'
    jobExecution = await JobExecution.create({
      jobId,
      dataflowId: dataflowId || null,
      dataflowVersionId,
      applicationId,
      clusterId,
      wuid: '',
      status: 'cloning',
      jobExecutionGroupId,
    });
    logger.info('------------------------------------------');
    logger.info(
      `✔️ createGithubFlow: START: JOB EXECUTION RECORD CREATED ${jobExecution.id}`
    );

    // # pull from github and submit job to HPCC.
    tasks = await hpccUtil.pullFilesFromGithub(jobName, clusterId, gitHubFiles);
    if (tasks.WUaction?.failedToUpdate) {
      await manuallyUpdateJobExecutionFailure({
        jobExecution,
        tasks,
        jobExecutionGroupId,
        jobName,
      });
    } else {
      // changing jobExecution status to 'submitted' will signal status poller that this job if ready to be executed
      const updated = await jobExecution.update(
        { status: 'submitted', wuid: tasks.wuid },
        { where: { id: jobExecution.id, status: 'cloning' } }
      );
      tasks.jobExecution = updated.toJSON();
    }
    return tasks; // quick summary about github flow that happened.
  } catch (error) {
    await manuallyUpdateJobExecutionFailure({
      jobExecution,
      tasks,
      jobExecutionGroupId,
      jobName,
    });
    logger.error('utils/assets - createGithubFlow: ', error);
  }
};

const manuallyUpdateJobExecutionFailure = async ({
  jobExecution,
  tasks,
  jobName,
  jobExecutionGroupId,
}) => {
  try {
    // attempt to update WU at hpcc as failed was unsuccessful, we need to update our record manually as current status "cloning" will not be picked up by status poller.
    const wuid = tasks?.wuid || '';
    await jobExecution.update(
      { status: 'error', wuid },
      { where: { id: jobExecution.id, status: 'cloning' } }
    );
    const { dataflowId, jobId } = jobExecution;
    await workflowUtil.notifyJob({
      dataflowId,
      jobExecutionGroupId,
      jobId,
      status: 'error',
      exceptions: tasks.error,
    });
    await workflowUtil.notifyWorkflow({
      dataflowId,
      jobExecutionGroupId,
      jobName,
      status: 'error',
      exceptions: tasks.error,
    });
  } catch (error) {
    logger.error('utils/assets - manuallyUpdateJobExecutionFailure: ', error);
  }
};

exports.getJobEXecutionForProcessing = async () => {
  try {
    const jobExecution = await JobExecution.findAll({
      where: {
        [Op.or]: [
          { status: 'submitted' },
          { status: 'blocked' },
          { status: 'wait' },
        ],
      },
      order: [['updatedAt', 'desc']],
      include: [{ model: Job, attributes: ['name'] }],
    });
    return jobExecution;
  } catch (error) {
    logger.error('utils/assets - getJobEXecutionForProcessing: ', error);
  }
};

exports.deleteFileMonitoring = async ({ fileTemplateId, dataflowId }) => {
  const fileMonitoring = await FileMonitoring.findOne({
    where: { fileTemplateId },
  });
  if (!fileMonitoring) return; // If fileMonitoring does not exit, we will do nothing
  if (fileMonitoring.metaData?.dataflows?.length > 1) {
    const newDataFlowList = fileMonitoring.metaData.dataflows.filter(
      dfId => dfId !== dataflowId
    );
    await fileMonitoring.update({
      metaData: { ...fileMonitoring.metaData, dataflows: newDataFlowList },
    });
    logger.info('--MONITORING UPDATED----------------------------------------');
    logger.info({
      wuid: fileMonitoring.wuid,
      fileMonitoring: fileMonitoring.id,
    });
    logger.info('------------------------------------------');
  } else {
    const workUnitService = await hpccUtil.getWorkunitsService(
      fileMonitoring.cluster_id
    );
    const WUactionBody = {
      Wuids: { Item: [fileMonitoring.wuid] },
      WUActionType: 'Abort',
    };
    await workUnitService.WUAction(WUactionBody); // Abort wu in hpcc
    await fileMonitoring.destroy();
    logger.info('---MONITORING REMOVED---------------------------------------');
    logger.info({
      wuid: fileMonitoring.wuid,
      fileMonitoring: fileMonitoring.id,
    });
    logger.info('------------------------------------------');
  }
};

exports.createFileMonitoring = async ({ fileTemplateId, dataflowId }) => {
  /*  Check if there is existing File Monitoring WU based on this template.
  If there is existing file monitoring WU, there is no need to create a new one */
  const fileMonitoringWU = await FileMonitoring.findOne({
    where: { fileTemplateId },
  });

  if (!fileMonitoringWU) {
    // Get template details
    const template = await FileTemplate.findOne({
      where: { id: fileTemplateId },
    });
    if (!template) throw Error('Template not found');

    const { machine, lzPath, directory, landingZone, monitorSubDirs } =
      template.metaData;
    let dirPath = directory.join('/');
    const completeDirPath = `${lzPath}/${dirPath}/`;

    const pattern = {
      endsWith: `*${template.searchString}`,
      contains: `*${template.searchString}*`,
      startsWith: `${template.searchString}*`,
      wildCards: template.searchString,
    };

    let filePattern = `${completeDirPath}${pattern[template['fileNamePattern']]}`;

    //Create empty WU
    const wuId = await hpccUtil.createWorkUnit(template.cluster_id, {
      jobname: `${template.title}_File_Monitoring`,
    });
    //  construct ecl code with template details and write it to fs
    const code = hpccUtil.constructFileMonitoringWorkUnitEclCode({
      lzPath,
      filePattern,
      monitorSubDirs,
      lzHost: machine,
      wu_name: `${template.title}_File_Monitoring`,
    });

    const parentDir = path.join(process.cwd(), 'eclDir');
    const pathToEclFile = path.join(
      process.cwd(),
      'eclDir',
      `${template.title}.ecl`
    );
    fs.writeFileSync(pathToEclFile, code);

    // update the wu with ecl archive
    const args = ['-E', pathToEclFile, '-I', parentDir];
    const archived = await hpccUtil.createEclArchive(args, parentDir);

    const updateBody = {
      Wuid: wuId,
      QueryText: archived.stdout,
      Jobname: `${template.title}_File_Monitoring`,
    };

    const workUnitService = await hpccUtil.getWorkunitsService(
      template.cluster_id
    );
    await workUnitService.WUUpdate(updateBody);

    //Submit the wu
    const submitBody = { Wuid: wuId, Cluster: 'hthor' };
    await workUnitService.WUSubmit(submitBody);
    fs.unlinkSync(pathToEclFile);

    //Add to file monitoring table
    const fileMonitoring = await FileMonitoring.create({
      wuid: wuId,
      cluster_id: template.cluster_id,
      dataflow_id: dataflowId,
      fileTemplateId: template.id,
      metaData: { dataflows: [dataflowId] },
    });

    logger.info('--MONITORING CREATED----------------------------------------');
    logger.info({ wuid: wuId, fileMonitoring: fileMonitoring.id });
    logger.info('------------------------------------------');
  } else {
    let newMetaData = {
      ...fileMonitoringWU.metaData,
      dataflows: [...fileMonitoringWU.metaData.dataflows, dataflowId],
    }; // Dataflows using the same file monitoring WU

    await FileMonitoring.update(
      { metaData: newMetaData },
      { where: { id: fileMonitoringWU.id } }
    );
    logger.info('--MONITORING UPDATED----------------------------------------');
    logger.info({
      wuid: fileMonitoringWU.wuid,
      fileMonitoring: fileMonitoringWU.id,
    });
    logger.info('------------------------------------------');
  }
};

exports.addJobToBreeSchedule = (
  job,
  schedule,
  dataflowId,
  dataflowVersionId
) => {
  // ADD JOB TO BREE SCHEDULE
  const getfileName = () => {
    switch (job.jobType) {
      case 'Script':
        return SUBMIT_SCRIPT_JOB_FILE_NAME;
      case 'Manual':
        return SUBMIT_MANUAL_JOB_FILE_NAME;
      default: {
        if (job.metaData.isStoredOnGithub) {
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
    cron: schedule.cron,
    jobType: job.jobType,
    contact: job.contact,
    metaData: job.metaData,
    sprayFileName: job.sprayFileName,
    sprayDropZone: job.sprayFileName,
    sprayedFileScope: job.sprayedFileScope,
    clusterId: job.cluster_id,
    dataflowId,
    dataflowVersionId,
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

  const result = JobScheduler.addJobToScheduler(jobSettings);
  if (result.error) throw new Error(result.error);

  logger.info('-JOB SCHEDULED-Time----------------------------------------');
  logger.info({ job: job.id, jobname: job.name, schedule });
  logger.info('------------------------------------------');
};
