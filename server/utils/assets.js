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
let Index = models.indexes;

exports.fileInfo = (applicationId, file_id) => {
  var results={};
  return new Promise((resolve, reject) => {
    File.findOne({where:{"application_id":applicationId, "id":file_id}, include: [{model: Groups, as: 'groups'}]}).then(function(files) {
      results.basic = files;
      FileLayout.findAll({where:{"application_id":applicationId, "file_id":file_id}}).then(function(fileLayout) {
        let fileLayoutObj = (fileLayout.length == 1 && fileLayout[0].fields) ? JSON.parse(fileLayout[0].fields) : fileLayout;
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