const express = require('express');
const router = express.Router();
let mongoose = require('mongoose');
var models  = require('../../models');
let Job = models.job;
let JobFile = models.jobfile;
let JobParam = models.jobparam;
let File = models.file;

router.post('/saveJob', (req, res) => {
    console.log("[saveJob] - Get file list for app_id = " + req.body._id + " isNewJob: "+req.body.isNewJob);
    var jobId='', applicationId=req.body.basic.applicationId, fieldsToUpdate={};
    try {
        Job.findOrCreate({
            where: {name: req.body.basic.name, application_id:req.body.basic.applicationId},
            defaults: req.body.basic
        }).then(async function(result) {
            jobId = result[0].id;
            fieldsToUpdate = {"job_id"  : jobId, "application_id" : applicationId};
            if(!result[1]) {
                Job.update(req.body.basic, {where:{application_id:applicationId, name:req.body.basic.name}}).then(function(result){})
            }
            var deleteFiles = await JobFile.destroy({where:{ job_id: jobId, application_id:applicationId }});

            var jobFileToSave = updateCommonData(req.body.files, fieldsToUpdate);
            return JobFile.bulkCreate(
                jobFileToSave, {updateOnDuplicate: ["file_type", "name", "description"]}
            )
        }).then(function(jobFile) {
            var jobParamsToSave = updateCommonData(req.body.params, fieldsToUpdate);
            return JobParam.bulkCreate(
                jobParamsToSave,
                {updateOnDuplicate: ["name", "type"]}
            )
        }).then(function(jobParam) {
            res.json({"result":"success"});
        }), function(err) {
            return res.status(500).send(err);
        }
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/job_list', (req, res) => {
    console.log("[job list/read.js] - Get job list for app_id = " + req.query.app_id);
    try {
        Job.findAll({"applicationId":req.query.app_id}).then(function(jobs) {
            res.json(jobs);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});


router.get('/job_details', (req, res) => {
    console.log("[job_details] - Get job list for app_id = " + req.query.app_id + " query_id: "+req.query.job_id);
    let jobFiles = [];
    try {
        Job.findOne({where:{"application_id":req.query.app_id, "id":req.query.job_id}, include: [JobFile, JobParam]}).then(async function(job) {
            var jobData = job.get({ plain: true });
            for(jobFileIdx in jobData.jobfiles) {
                var jobFile = jobData.jobfiles[jobFileIdx];
                var file = await File.findOne({where:{"application_id":req.query.app_id, "id":jobFile.file_id}});
                if(file != undefined) {
                    jobFile.description = file.description;
                    jobFile.title = file.title;
                    jobFile.fileType = file.fileType;
                    jobFile.qualifiedPath = file.qualifiedPath;
                    jobData.jobfiles[jobFileIdx] = jobFile;
                }
            }
            return jobData;
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

router.post('/delete', (req, res) => {
    console.log("[delete/read.js] - delete job = " + req.body.jobId + " appId: "+req.body.application_id);
    Job.destroy(
        {where:{"id": req.body.jobId, "application_id":req.body.application_id}}
    ).then(function(deleted) {
        JobFile.destroy(
            {where:{ job_id: req.body.jobId }}
        ).then(function(jobFileDeleted) {
            JobParam.destroy(
                {where:{ job_id: req.body.jobId }}
            ).then(function(jobParamDeleted) {
                res.json({"result":"success"});
            });
        });
    }).catch(function(err) {
        console.log(err);
    });
});

function updateCommonData(objArray, fields) {
    Object.keys(fields).forEach(function (key, index) {
        objArray.forEach(function(obj) {
            obj[key] = fields[key];
        });
    });
    return objArray;
}

module.exports = router;