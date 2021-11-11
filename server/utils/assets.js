var models  = require('../models');
let File = models.file;
let FileLayout = models.file_layout;
let FileLicense = models.file_license;
let FileRelation = models.file_relation;
let FileFieldRelation = models.file_field_relation;
let FileValidation = models.file_validation;
let License = models.license;
let Groups = models.groups;
let Query = models.query;
let QueryField = models.query_field;
let IndexKey = models.index_key;
let IndexPayload = models.index_payload;
let Job = models.job;
let JobFile = models.jobfile;
let JobParam = models.jobparam;
let ConsumerObject = models.consumer_object;
let JobExecution = models.job_execution;
let Index = models.indexes;
const hpccUtil = require('./hpcc-util');
const workflowUtil = require('./workflow-util');
let Sequelize = require('sequelize');
const path = require('path');
const {execFile, spawn} = require('child_process');

exports.fileInfo = (applicationId, file_id) => {
  var results={};
  return new Promise((resolve, reject) => {
    File.findOne({where:{"application_id":applicationId, "id":file_id}, include: [{model: Groups, as: 'groups'}]}).then(function(files) {
      results.basic = files;
      let fileLayout = {};
      FileLayout.findAll({where:{"application_id":applicationId, "file_id":file_id}}).then(async function(dbFileLayout) {
        //console.log(dbFileLayout.fields.length)
        if(!dbFileLayout || (dbFileLayout && (dbFileLayout.length == 0 || !dbFileLayout[0].fields || dbFileLayout[0].fields.length == 0))) {
          //for some reason, if file layout is empty, fetch it from hpcc and save it to db
          console.log("File Layout Empty....."+files.name, files.cluster_id)
          let fileInfo  = await hpccUtil.fileInfo(files.name, files.cluster_id);
          let fileLayout = {};
          if(fileInfo) {
            fileLayout = fileInfo.file_layouts; 
            //save file layout back to db
            await FileLayout.findOrCreate({
              where:{application_id:applicationId, file_id: file_id},
              defaults:{
                application_id: applicationId,
                file_id: file_id,
                fields: JSON.stringify(fileLayout)
              }
            }).then(async (dbFileLayout) => {
              let fileLayoutId = dbFileLayout[0].id;
              //console.log(fileLayout);
              if(!dbFileLayout[1]) {
                console.log("updating file layout")
                console.log(fileLayout.length)
                await FileLayout.update({fields:JSON.stringify(fileLayout)}, {where: {application_id:applicationId, file_id: file_id}});
              }
            })
          }
        }

        let fileLayoutObj = (dbFileLayout.length == 1 && dbFileLayout[0].fields) ? JSON.parse(dbFileLayout[0].fields) : fileLayout;
        results.file_layouts = fileLayoutObj.filter(item => item.name != '__fileposition__');

        FileLicense.findAll({where:{"application_id":applicationId, "file_id":file_id}}).then(function(fileLicenses) {
          results.file_licenses = fileLicenses;
            FileValidation.findAll({where:{"application_id":applicationId, "file_id":file_id}}).then(function(fileValidations) {
                results.file_validations = fileValidations.filter(item => item.name != '__fileposition__');
            }).then(function(fileFieldRelation) {
              ConsumerObject.findAll({where:{"object_id":file_id, "object_type":"file"}}).then(function(fileConsumers) {
                results.consumers = fileConsumers;
                resolve(results);
              });
            });
        });
      })
    })
    .catch(function(err) {
        console.log(err);
        reject("Error occured while retrieving file details")
    });
  })
}

exports.fileSearch = (applicationId, keyword) => {
  var results={};
  return new Promise((resolve, reject) => {
    let query =  "select f.id, f.name, f.title, f.description, f.createdAt, 'File' as type from file f where f.application_id = (:applicationId) and f.deletedAt IS NULL and (f.name REGEXP (:keyword) or f.title REGEXP (:keyword)) ";
    let replacements = { applicationId: applicationId, keyword: keyword };
    models.sequelize.query(query, {
      type: models.sequelize.QueryTypes.SELECT,
      replacements: replacements
    }).then(files => {
      let results=[];
      if(files) {
        files.forEach((file) => {
          results.push({"text": file.name ? file.name : file.title, "value":file.name});
        })
        resolve(results);
      }
    }).catch(function(err) {
      console.log(err);
      reject(err);
    });
  })
}

exports.indexInfo = (applicationId, indexId) => {
  var basic = {}, results={};
  try {
    return new Promise((resolve, reject) => {
      Index.findOne({where:{"application_id":applicationId, "id":indexId}, include: [{model: IndexKey}, {model: IndexPayload}, {model: Groups, as: 'groups'}]}).then(function(index) {
        console.log(index);
        results.basic = index;
        resolve(results);
      })
      .catch(function(err) {
        console.log(err);
        reject(err);
      });
    })
  } catch (err) {
    console.log('err', err);
    reject(err);
  }
}

exports.queryInfo = (applicationId, indexId) => {
  var basic = {}, results={};
  try {
    return new Promise((resolve, reject) => {
      Query.findOne({where:{"application_id":applicationId, "id":indexId}, include: [{model: QueryField}, {model: Groups, as: 'groups'}]}).then(function(query) {
        results.basic = query;
        resolve(results);
      })
      .catch(function(err) {
        console.log(err);
        reject(err);
      });
    })
  } catch (err) {
    console.log('err', err);
    reject(err);
  }
}

exports.jobInfo = (applicationId, jobId) => {
  var basic = {}, results={};
  let jobFiles = [];
  try {
    return new Promise((resolve, reject) => {
      Job.findOne({where:{"application_id":applicationId, "id":jobId}, attributes:['id', 'description', 'title', 'name', 'author', 'contact', 'ecl', 'entryBWR', 'gitRepo', 'jobType', 'cluster_id'], include: [JobFile, JobParam]}).then(async function(job) {
        var jobData = job.get({ plain: true });
        for(jobFileIdx in jobData.jobfiles) {
          var jobFile = jobData.jobfiles[jobFileIdx];
          var file = await File.findOne({where:{"application_id":applicationId, "id":jobFile.file_id}});
          if(file != undefined) {
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
      }).then(function(jobData) {
          resolve(jobData);
      })
      .catch(function(err) {
        reject(err)
      });
    })
  } catch (err) {
    reject(err)
  }
}

exports.executeScriptJob = (jobId) => {
  try {
    return new Promise(async (resolve, reject) => {
      let scriptJob = await Job.findOne({where: {id: jobId}, attributes: {exclude: ['assetId']}});
      let scriptName = scriptJob.scriptPath && scriptJob.scriptPath.indexOf(' ') != -1 ? scriptJob.scriptPath.substr(0, scriptJob.scriptPath.indexOf(' ')) : scriptJob.scriptPath;
      let scriptParams = scriptJob.scriptPath && scriptJob.scriptPath.indexOf(' ') != -1 ? scriptJob.scriptPath.substr(scriptJob.scriptPath.indexOf(' ') + 1) : '';
      let scriptPath = path.join(__dirname, '../scripts', scriptName), scriptRootFolder = path.dirname(scriptPath);
      let cmd = process.platform == 'win32' ? 'cmd.exe' : 'sh';
      execFile(cmd, [scriptPath, scriptParams], {cwd: scriptRootFolder}, (err, stdout, stderr) => {
        console.log(stdout)
        if (err) {
          reject(err)
        }
        if(stderr) {
          reject(stderr);
        }
        resolve(stdout);
      });
    })
  }catch (err) {
    Promise.reject(err)
  }
}

exports.recordJobExecution = (workerData, wuid) => {
  try {
    return new Promise((resolve, reject) => {
      JobExecution.findOrCreate({
        where: {
          jobId: workerData.jobId,
          applicationId: workerData.applicationId
        },
        defaults: {
          jobId: workerData.jobId,
          dataflowId: workerData.dataflowId,
          applicationId: workerData.applicationId,
          wuid: wuid,
          clusterId: workerData.clusterId,
          status: workerData.status
        }
      }).then(async (result) => {
        let jobExecutionId = result[0].id;
        if(!result[1]) {
          await JobExecution.update({
            jobId: workerData.jobId,
            dataflowId: workerData.dataflowId,
            applicationId: workerData.applicationId,
            wuid: wuid,
            status: workerData.status
          },
          {where: {id: jobExecutionId}})
        }
        resolve({jobExecutionId});
      }).catch((err) => {
        console.log(err);
        reject(err)
      })
    })
  }catch (err) {
    console.log(err)
    reject(err);
    //Promise.reject(err)
  }
}

exports.createFilesandJobfiles = async ({file, cluster_id, application_id, id})=>{
  try {
    const fileInfo = await hpccUtil.fileInfo(file.name, cluster_id);
    if (!fileInfo) throw new Error("Failed to get File Info");
    const fileCreated = await File.create({
      "description": fileInfo.basic.description,
      "isSuperFile": fileInfo.basic.isSuperfile,
      "qualifiedPath": fileInfo.basic.pathMask,
      "fileType": fileInfo.basic.fileType,
      "application_id": application_id,
      "title": fileInfo.basic.fileName,
      "scope": fileInfo.basic.scope,
      "name": fileInfo.basic.name,
      "cluster_id": cluster_id,
      "dataflowId":'',
    })
    // #2 create JobFile;
     await JobFile.create({
      application_id: application_id,
      name: fileInfo.basic.name,
      file_type: file.file_type,
      file_id: fileCreated.id,
      job_id: id, 
    });
  } catch (error) {
    console.log('--Error in createFilesandJobfiles----------------------------------------');
    console.dir(error, { depth: null });
    console.log('------------------------------------------');
    throw error;
  }
}

exports.createGithubFlow = async ({jobId, jobName, gitHubFiles, dataflowId, applicationId, clusterId }) =>{
  try {
    // # create Job Execution with status 'cloning'
    const jobExecution = await JobExecution.create({ jobId, dataflowId, applicationId, clusterId, wuid:"",  status: 'cloning' });
    console.log('------------------------------------------');
    console.log(`createGithubFlow: JOB EXECUTION RECORD CREATED --${jobExecution.id}---`);    
    console.log('------------------------------------------');
    // # pull from github and submit job to HPCC.
    const tasks =  await hpccUtil.pullFilesFromGithub( jobName ,clusterId, gitHubFiles );
    if (tasks.WUaction?.failedToUpdate) {
      try {
        // attempt to update WU at hpcc as failed was unsuccessful, we need to update our record manually as current status "cloning" will not be picked up by status poller.
        await jobExecution.update({status: 'failed', wuid: tasks.wuid ||''});
        await workflowUtil.notifyJobFailure(jobName, clusterId, tasks.wuid);
      } catch (error) {
        console.log('------------------------------------------');
        console.log("createGithubFlow: Failed to notify", error);
        console.log('------------------------------------------');
      }
    } else {
      // changing jobExecution status to 'submitted' will signal status poller that this job if ready to be executed
     const updated = await jobExecution.update({status:'submitted', wuid: tasks.wuid }) 
     console.log('------------------------------------------');
     console.log('LAST STEP IN --createGithubFlow--');
     console.log("createGithubFlow: JOB EXECUTION UPDATED");
     console.dir(updated.toJSON(), { depth: null });
     console.log('------------------------------------------');
    }
    return tasks; // quick summary about github flow that happened.
  } catch (error) {
    console.log('------------------------------------------');
    console.log('createGithubFlow: "Error happened"');
    console.dir(error);
    console.log('------------------------------------------');
  }
}

exports.getJobEXecutionForProcessing = async () => {
  try {
    console.log("**********************getJobForProcessing*******************")
    const jobExecution = await JobExecution.findOne({
      where: {'status': 'submitted'}, 
      order: [["updatedAt", "desc"]]
    });
    /*if(jobExecution) {
      let jobExecutionAwaited = await JobExecution.update({
        status: 'processing'
      },{where: {jobId: jobExecution.jobId}});  
    }*/

    return jobExecution;  
  } catch (error) {
    console.log(error);
  }
} 
