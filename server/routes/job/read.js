const express = require('express');
const router = express.Router();
let mongoose = require('mongoose');
var models  = require('../../models');
let Job = models.job;
let JobFile = models.jobfile;
let JobParam = models.jobparam;
let File = models.file;
let FileLayout = models.file_layout;
let FileValidation = models.file_validation;
let DataflowGraph = models.dataflowgraph;
let Dataflow = models.dataflow;
const hpccUtil = require('../../utils/hpcc-util');
const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator/check');

let updateDataFlowGraph = (applicationId, dataflowId, nodes, edges) => {
  return new Promise((resolve, reject) => {
    DataflowGraph.findOrCreate({
      where: {application_id:applicationId, dataflowId:dataflowId},
      defaults: {
        application_id: applicationId,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        dataflowId: dataflowId
      }
    }).then(function(result) {
      graphId = result[0].id;
      if(!result[1]) {
        return DataflowGraph.findOne({where: {application_id:applicationId, dataflowId:dataflowId}});
      }
    }).then((dataflowGraph) => {
      let currentNodes = JSON.parse(dataflowGraph.nodes);
      let currentEdges = JSON.parse(dataflowGraph.edges);
      //remove any duplicate nodes
      nodes.forEach((node) => {
        currentNodes.forEach((currentNode, idx) => {
          if(currentNode.id == node.id) {
            currentNodes.splice(idx, 1);
          }
        })
      })
      currentNodes = currentNodes.concat(nodes);
      currentEdges = currentEdges.concat(edges);

      return DataflowGraph.update({
        application_id: applicationId,
        nodes: JSON.stringify(currentNodes),
        edges: JSON.stringify(currentEdges),
        dataflowId: dataflowId
      }, {where:{application_id:applicationId, dataflowId:dataflowId}}).then((dataflowGraphUpdate) => {
        resolve({'nodes':currentNodes, 'edges':currentEdges});
      })          
    }).catch((err) => {
      reject(err);
    })
  });
}

router.post('/saveJob', [  
  body('_id')
  .optional({checkFalsy:true})
    .isUUID(4).withMessage('Invalid id'),
  body('basic.applicationId')
    .isUUID(4).withMessage('Invalid application id'),
  body('basic.name')
  .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_.\-:]*$/).withMessage('Invalid title')
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[saveJob] - Get file list for app_id = " + req.body._id + " isNewJob: "+req.body.isNewJob);
  var jobId='', applicationId=req.body.basic.applicationId, fieldsToUpdate={}, nodes=[], edges=[];
  try {
    Job.findOrCreate({
      where: {name: req.body.basic.name, application_id:req.body.basic.applicationId},
      defaults: req.body.basic
    }).then(async function(result) {
      jobId = result[0].id;
      fieldsToUpdate = {"job_id"  : jobId, "application_id" : applicationId};
      if(!result[1]) {
        Job.update({
          author: req.body.basic.author,
          contact: req.body.basic.contact,
          description: req.body.basic.description,
          entryBWR: req.body.basic.entryBWR,
          gitRepo: req.body.basic.gitRepo,
          jobType: req.body.basic.jobType,
          title: req.body.basic.title,
          name: req.body.basic.name
        }, {where:{application_id:applicationId, name:req.body.basic.name}}).then(function(result){})
      }
      var deleteFiles = await JobFile.destroy({where:{ job_id: jobId, application_id:applicationId }});

      var jobFileToSave = updateCommonData(req.body.files, fieldsToUpdate);
      return JobFile.bulkCreate(
          jobFileToSave, {updateOnDuplicate: ["file_type", "name", "description", "gitRepo"]}
      )
    }).then(function(jobFile) {
      var jobParamsToSave = updateCommonData(req.body.params, fieldsToUpdate);
      JobParam.destroy({where:{application_id:applicationId, job_id: jobId}}).then((deleted) => {
        return JobParam.bulkCreate(
          jobParamsToSave
        )        
      })
    }).then(function(jobParam) {
        if(req.body.autoCreateFiles) {
          let fieldsToUpdate={}, promises=[];
          return new Promise((resolve, reject) => {
            nodes.push({
              "title": req.body.basic.name,
              "id": req.body.currentlyEditingId,
              "x": req.body.mousePosition[0],
              "y": req.body.mousePosition[1],
              "type": "Job",
              "jobId": jobId
            })
            req.body.files.forEach((file, idx) => {
              promises.push(
                hpccUtil.fileInfo(file.name, req.body.basic.clusterId).then((fileInfo) => {
                  return File.create({
                    "application_id": req.body.basic.applicationId,
                    "title": fileInfo.fileName,
                    "name": fileInfo.name,
                    "cluster_id": req.body.basic.clusterId,
                    "description": fileInfo.description,
                    "fileType": fileInfo.fileType,
                    "isSuperFile": fileInfo.isSuperFile,
                    "qualifiedPath": fileInfo.pathMask,
                    "dataflowId": req.body.basic.dataflowId,
                    "scope": fileInfo.scope
                  }).then((newFile) => {
                    let id=Math.floor(Date.now()), edge={};
                    console.log('jobFile: '+JSON.stringify(file));
                    let posX = file.file_type == 'input' ? req.body.mousePosition[0] - 75  : req.body.mousePosition[0] + 75;
                    let posY = file.file_type == 'input' ? req.body.mousePosition[1] - (45 * idx) : req.body.mousePosition[1] - (45 * idx);
                    nodes.push({
                      "title": fileInfo.fileName,
                      "id": id,
                      "x": posX,
                      "y": posY,
                      "type": "File",
                      "fileId": newFile.id
                    })

                    if(file.file_type == 'input') {
                      edge = {"source":id,"target":req.body.currentlyEditingId};
                    } else if(file.file_type == 'output') {
                      edge = {"source":req.body.currentlyEditingId,"target":id};
                    }
                    edges.push(edge);

                    fieldsToUpdate = {"file_id": newFile.id, "application_id" : applicationId};
                    let fileLayoutToSave = hpccUtil.updateCommonData(fileInfo.layout, fieldsToUpdate);                            
                    return FileLayout.bulkCreate(fileLayoutToSave, {updateOnDuplicate: ["name", "type", "displayType", "displaySize", "textJustification", "format","data_types", "isPCI", "isPII", "isHIPAA", "description", "required"]});
                 }).then((fileLayout) => {   
                    let fileValidationsToSave = hpccUtil.updateCommonData(fileInfo.validations, fieldsToUpdate);
                    return FileValidation.bulkCreate(
                      fileValidationsToSave,
                      {updateOnDuplicate: ["name", "ruleType", "rule", "action", "fixScript"]}
                    )
                 }).then((fileValidations) => {
                  console.log('file '+fileInfo.fileName+' processed...' )
                 }).catch(err => {
                  console.log('error occured: '+err)
                  reject(err);
                 })

                })
              );
            })
            console.log('resolving....');
            Promise.all(promises).then(() => {
              console.log("job and files created....")   
              
              updateDataFlowGraph(req.body.basic.applicationId, req.body.basic.dataflowId, nodes, edges).then((dataflowGraph) => {
                resolve(dataflowGraph)           
              });          
            });
          }).then((results) => {
            console.log('results: '+JSON.stringify(results));
            res.json({"result":"success", "title":req.body.basic.title, "jobId":jobId, "dataflow":results});
          });
        } else {
          res.json({"result":"success", "title":req.body.basic.title, "jobId":jobId});
        }
      }).catch((err) => {
        return res.status(500).send(err)
      })
  } catch (err) {
      console.log('err', err);
  }
});

router.get('/job_list', [    
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[job list/read.js] - Get job list for app_id = " + req.query.app_id);
  try {
    Job.findAll({where:{"application_Id":req.query.app_id}, include:[Dataflow], order: [['createdAt', 'DESC']]}).then(function(jobs) {
        res.json(jobs);
    })
    .catch(function(err) {
        console.log(err);
    });
  } catch (err) {
      console.log('err', err);
  }
});


router.get('/job_details', [    
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),
  query('job_id')
    .isUUID(4).withMessage('Invalid job id'),  
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
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
                jobFile.name = file.name;
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

router.post('/delete', [    
  body('application_id')
    .isUUID(4).withMessage('Invalid application id'),
  body('jobId')
    .isUUID(4).withMessage('Invalid job id'),  
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
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