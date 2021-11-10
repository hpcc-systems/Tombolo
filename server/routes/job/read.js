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
const workflowUtil = require('../../utils/workflow-util.js');
const validatorUtil = require('../../utils/validator');
const { body, query, param, validationResult } = require('express-validator');
const assetUtil = require('../../utils/assets');
const SUBMIT_JOB_FILE_NAME = 'submitJob.js';
const SUBMIT_SCRIPT_JOB_FILE_NAME = 'submitScriptJob.js';

/**
  Updates Dataflow graph by
    - removing any nodes that are removed from the Job
    - removing edges to those nodes
    - finally de-duping nodes and edges array
**/
let updateDataFlowGraph = (applicationId, dataflowId, nodes, edges, filesToBeRemoved) => {
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
      //console.log("***************filesToBeRemoved**********")
      //console.log(currentNodes);
      //console.log(filesToBeRemoved);
      //remove any file nodes (source/output) that are no longer available in the job
      if(filesToBeRemoved && filesToBeRemoved.length > 0) {
        for(var currentNodeIdx = currentNodes.length - 1; currentNodeIdx > -1; currentNodeIdx--) {
          if(filesToBeRemoved.filter(fileToBeRemoved => fileToBeRemoved.file_id != null && fileToBeRemoved.file_id == currentNodes[currentNodeIdx].fileId).length > 0) {
            //remove edge;
            for(var currentEdgeIdx=currentEdges.length - 1; currentEdgeIdx > -1; currentEdgeIdx--) {
              if(currentEdges[currentEdgeIdx].source == currentNodes[currentNodeIdx].id || currentEdges[currentEdgeIdx].target == currentNodes[currentNodeIdx].id) {
                currentEdges.splice(currentEdgeIdx, 1);
              }
            }
            //remove node
            currentNodes.splice(currentNodeIdx, 1);
          }
        }
      }
      //console.log("***************filesToBeRemoved - after**********")
      //console.log(currentNodes);

      //remove any duplicate nodes
      nodes = nodes.filter((node, nodeIdx) => {
        let duplicate = false;
        for (var i=0; i<currentNodes.length; i++) {
          //duplicate node found
          //console.log("*****************duplicate checking******************")
          //check node id, title and type
          //console.log(currentNodes[i], node);
          if((currentNodes[i].id == nodes[nodeIdx].id || currentNodes[i].name == node.name) && currentNodes[i].type == nodes[nodeIdx].type) {
            duplicate = true;
            edges = edges.map((edge) => {
              if(edge.source == nodes[nodeIdx].id) {
                edge.source = currentNodes[i].id
              }

              if(edge.target == nodes[nodeIdx].id) {
                edge.target = currentNodes[i].id
              }
              return edge;
            })
          }
        }

        return !duplicate;
      })

      //dedup edges. duplicate nodes are already taken care above
      currentEdges = currentEdges.concat(edges);
      let dedupedEdges = [];
      currentEdges.forEach((currentEdge) => {
        let edgeExists = dedupedEdges.filter(dedupEdge => {
          return (dedupEdge.source == currentEdge.source && dedupEdge.target == currentEdge.target)
        })
        if(edgeExists.length == 0) {
          dedupedEdges.push(currentEdge)
        }
      })

      currentNodes = currentNodes.concat(nodes);
      //console.log("*******************updateDataFlowGraph************")
      //console.log(currentNodes);
      //currentEdges = currentEdges.concat(edges);
      DataflowGraph.update({
        application_id: applicationId,
        nodes: JSON.stringify(currentNodes),
        edges: JSON.stringify(dedupedEdges),
        dataflowId: dataflowId
      }, {where:{application_id:applicationId, dataflowId:dataflowId}}).then((dataflowGraphUpdate) => {
        if(dataflowGraphUpdate) {
          resolve({'nodes':currentNodes, 'edges':dedupedEdges});
        }

      })
    }).catch((err) => {
      console.log(err)
      reject(err);
    })
  });
}

/**
  Creates File associated with a Job and forms the node and edges objects for it to be passed on to the Dataflow Graph.
  New files are created and nodes/edges added accordingly.
  For Existing files, only node/edge data is updated - This is basically done to avoid duplicate nodes in the dataflow. if a job uses input files
  from previous job, instead of creating a new set of files, the dataflow will be updated showing a path from the input files from previous jobs to
  the new job
**/
let updateFileRelationship = (jobId, job, files, filesToBeRemoved, existingNodes) => {
  let fieldsToUpdate={}, promises=[], nodes = [], edges = [], inputY=0, outputY=0, existingNode={};
  return new Promise(async (resolve, reject) => {
    try {
      let query = 'select f.id, f.name, f.title, jf.file_type from file f, jobfile jf where '+
        'f.application_id = (:applicationId) AND '+
        'f.name =(:fileName) AND '+
        'f.deletedAt is null AND '+
        'jf.deletedAt is null AND '+
        'jf.job_id = (:job_id) and jf.file_type = (:file_type) group by f.id, f.title';
      files = sortFiles(files);
      //files.forEach(async (file, idx) => {
      for(let idx = 0; idx < files.length; idx++) {
        const file = files[idx];
        //promises.push(Promise.reject("error rejecting...."));
        let fileInfo = await hpccUtil.fileInfo(file.name, job.basic.clusterId);
        if(fileInfo) {
          let replacements = { applicationId: job.basic.application_id, fileName: fileInfo.basic.name, job_id: jobId, file_type: file.file_type};
          let existingFile = await models.sequelize.query(query, {
            type: models.sequelize.QueryTypes.SELECT,
            replacements: replacements
          })
          //file does not exists or exists with a different type
          if(!existingFile || existingFile.length == 0) {
            //console.log("****************file does not exist**************")
           let fileCreated = await File.create({
              "application_id": job.basic.application_id,
              "title": fileInfo.basic.fileName,
              "name": fileInfo.basic.name,
              "cluster_id": job.basic.clusterId,
              "description": fileInfo.basic.description,
              "fileType": fileInfo.basic.fileType,
              "isSuperFile": fileInfo.basic.isSuperFile,
              "qualifiedPath": fileInfo.basic.pathMask,
              "dataflowId": job.basic.dataflowId,
              "scope": fileInfo.basic.scope
            })
            let assetsDataflowCreated = await AssetDataflow.create({
              assetId: fileCreated.id,
              dataflowId: job.basic.dataflowId
            });
            //update file_id in JobFile
            //console.log(fileCreated.id, job.basic.id, file.file_type, fileInfo.basic.name);
            let jobFileUpdated = await JobFile.update({
              file_id: fileCreated.id
            }, {where: {application_id: job.basic.application_id, job_id: job.basic.jobId, file_type: file.file_type, name: fileInfo.basic.name}})

            let id=fileCreated.id, edge={};
            //console.log('jobFile: '+JSON.stringify(file));
            //starting from top

            if(file.file_type == 'input') {
              inputY = getYPosition(inputY, file.file_type, job.mousePosition[1], files);
            } else if(file.file_type == 'output') {
              outputY = getYPosition(outputY, file.file_type, job.mousePosition[1], files);
            }
            //console.log(idx)
            let posX = file.file_type == 'input' ? job.mousePosition[0] - 114  : parseInt(job.mousePosition[0]) + 114;
            let posY = file.file_type == 'input' ? inputY  : outputY;
            nodes.push({
              "title": fileInfo.basic.fileName,
              "name": fileInfo.basic.fileName,
              "id": fileCreated.id,
              "x": posX,
              "y": posY,
              "type": "File",
              "fileId": fileCreated.id
            })
            if(file.file_type == 'input') {
              edge = {"source":fileCreated.id,"target":job.basic.id};
            } else if(file.file_type == 'output') {
              edge = {"source":job.basic.id,"target":fileCreated.id};
            }
            edges.push(edge);
            fieldsToUpdate = {"file_id": fileCreated.id, "application_id" : job.basic.application_id};
            await FileLayout.create({
              application_id: job.basic.application_id,
              file_id: fileCreated.id,
              fields: JSON.stringify(fileInfo.file_layouts)
            })

            let fileValidationsToSave = hpccUtil.updateCommonData(fileInfo.file_validations, fieldsToUpdate);
            let fileValidations = await FileValidation.bulkCreate(
              fileValidationsToSave,
              {updateOnDuplicate: ["name", "ruleType", "rule", "action", "fixScript"]}
            )
          } else {            
            //console.log("****************file exist**************")
            let id=existingFile[0].id, edge={};
            //console.log("*********************** "+existingFile[0].name, id);
            if(existingNodes) {
              existingNode = existingNodes.filter(node => node.id == id)[0];
              //adding name attribute to old file nodes
              if(existingNode) {
                existingNode.name = existingFile[0].name;
              }
            }
            //console.log(existingNode)
            //update file_id in JobFile - this is the case when a job was added via assets and later the job is added to a workflow
            //when job is created from assets, there is no association with actual file at that time
            let jobFileUpdated = await JobFile.update({
              file_id: id
            }, {where: {application_id: job.basic.application_id, job_id: job.basic.jobId, file_type: file.file_type, name: fileInfo.basic.name}})

            let assetsDataflowCreated = await AssetDataflow.findOrCreate({
              where: {assetId: id, dataflowId: job.basic.dataflowId},
              defaults: {
                assetId: id,
                dataflowId: job.basic.dataflowId
              }
            });

            //starting from top
            if(file.file_type == 'input') {
              inputY = getYPosition(inputY, file.file_type, job.mousePosition[1], files);
            } else if(file.file_type == 'output') {
              outputY = getYPosition(outputY, file.file_type, job.mousePosition[1], files);
            }

            let posX = file.file_type == 'input' ? job.mousePosition[0] - 114  : parseInt(job.mousePosition[0]) + 114;
            let posY = file.file_type == 'input' ? inputY  : outputY;
            //console.log(existingFile[0]);
            let node = {
              "title": existingFile[0].title,
              "name": existingFile[0].name,
              "id": existingFile[0].id,
              "x": posX,
              "y": posY,
              "type": "File",
              "fileId": existingFile[0].id,
              "isHidden": existingNode ? existingNode.isHidden : false
            }
            //node deleted from workflow but exists in cluster and tombolo
            if(!existingNode) {
              existingNode = node;
            }
            nodes.push(node)

            if(file.file_type == 'input' && existingNode && !existingNode.isHidden) {
              edge = {"source":existingFile[0].id,"target":job.basic.id};
            } else if(file.file_type == 'output' && existingNode && !existingNode.isHidden) {
              edge = {"source":job.basic.id,"target":existingFile[0].id};
            }
            edges.push(edge);

            //console.log(nodes);
            //console.log(edges)
          }
        }
      }
      console.log("job and files created....")
      updateDataFlowGraph(job.basic.application_id, job.basic.dataflowId, nodes, edges, filesToBeRemoved).then((dataflowGraph) => {
        resolve(dataflowGraph)
      });
    } catch (err) {
      console.log("job and files creation failed....")
      reject(err);
    }
  })
}

let getYPosition = (yPos, type, jobYPos, files) => {
  //find the y of the first node assmuming nodes are placed from top to bottom.
  //TopY = No:Of input files / 2 * (2 * 65)
  //if derived yPos = jobYPos, then move the yPos 2 node space down
  if(yPos == 0) {
   yPos = parseInt(jobYPos) - ((Math.round(files.filter(file => file.file_type == type).length / 2) * 65));
  } else {
    yPos = yPos + 65;
    yPos = (yPos == parseInt(jobYPos)) ? yPos + 65 : yPos;
  }
  return yPos;
}

let findFilesRemovedFromJob = (currentFiles, filesFromCluster) => {
  let filesTobeRemoved = [];
  currentFiles.forEach((currentFile) => {
    let existingFile = filesFromCluster.filter(fileFromCluster => (fileFromCluster.file_type == currentFile.file_type && fileFromCluster.name == currentFile.name));
    if(existingFile.length == 0) {
      filesTobeRemoved.push(currentFile);
    }
  })
  return filesTobeRemoved;
}

/**
  This method updates the JobFile table based on the changes happend to the Job
  It also identifies the files that are removed from the Job, so the nodes & edges can be removed
**/
let updateJobDetails = (applicationId, jobId, jobReqObj, autoCreateFiles, nodes, dataflowId) => {
  let fieldsToUpdate = {"job_id"  : jobId, "application_id" : applicationId};

  return new Promise(async (resolve, reject) => {
    let filesToBeRemoved = [];
    let jobFiles = await JobFile.findAll({where:{ job_id: jobId, application_id:applicationId, file_id: {[Op.not]: null}  }, order: [["name", "asc"]], raw:true})
    //console.log("******************updatejobdetails***************")
    //console.log(jobFiles)
    //console.log(jobFiles.length)

    //console.log(jobReqObj.files)
    //find files that are removed from the Job and remove them from JobFile table
    if(jobFiles && jobFiles.length > 0) {
      filesToBeRemoved = findFilesRemovedFromJob(jobFiles, jobReqObj.files);

      let idsOfFilesToBeRemoved = filesToBeRemoved.map(fileToBeRemoved => fileToBeRemoved.id);

      var deleteFiles = await JobFile.destroy({
        where:{ id: {[Sequelize.Op.in]:idsOfFilesToBeRemoved}, application_id:applicationId }});

      console.log(idsOfFilesToBeRemoved);
    }
    //create new JobFile entries, if new files are added to the job
    var jobFileToSave = updateCommonData(jobReqObj.files, fieldsToUpdate);
    //jobReqObj.files.forEach(async (file) => {
    for(var i=0; i<jobReqObj.files.length; i++) {
      let file = jobReqObj.files[i];
      //console.log(jobId, applicationId, file.file_type, file.name)
      let jobFileCreated = await JobFile.findOrCreate({
        where: {job_id: jobId, application_id: applicationId, file_type: file.file_type, name: file.name},
        defaults: {
          job_id: jobId,
          application_id: applicationId,
          file_type: file.file_type,
          name: file.name
        }
      });
      await AssetDataflow.findOrCreate({
        where: {assetId: jobId, dataflowId: dataflowId},
        defaults: {
          assetId: file.id,
          dataflowId: dataflowId
        }
      })
    }

     var jobParamsToSave = updateCommonData(jobReqObj.params, fieldsToUpdate);
     JobParam.destroy({where:{application_id:applicationId, job_id: jobId}}).then((deleted) => {
        return JobParam.bulkCreate(jobParamsToSave)
      }).then(function(jobParam) {
        if(autoCreateFiles) {
          updateFileRelationship(jobId, jobReqObj, jobReqObj.files, filesToBeRemoved, nodes).then((results) => {
            //console.log("****************")
            resolve({"success": true, "title":jobReqObj.basic.title, "jobId":jobId, "dataflow":results})
          }).catch((err) => {
            console.error("****************-2")
            console.log("updateJobDetails failed...")
            reject(err);
          })
        } else {
          resolve({"success": true, "title":jobReqObj.basic.title, "jobId":jobId})
        }
      }).catch((err) => {
        console.log("updatejobdetails failed reject-1")
        reject(err)
      })
  }).catch((err) => {
    console.log("updatejobdetails failed reject-2")
    return Promise.reject(err)
  })
}

router.post('/createFileRelation', [
  body('jobId').optional({checkFalsy:true}).isUUID(4).withMessage('Invalid job id'),
  body('clusterId').optional({checkFalsy:true}).isUUID(4).withMessage('Invalid cluster id'),
  body('dataflowId').optional({checkFalsy:true}).isUUID(4).withMessage('Invalid dataflowId'),
  body('currentlyEditingId').optional({checkFalsy:true}).isInt().withMessage('Invalid currentlyEditingId'),
  body('mousePosition').optional({checkFalsy:true}).isString().withMessage('Invalid mousePostion')
], async (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  let dataflowGraph = await DataflowGraph.findOne({where: {dataflowId: req.body.dataflowId}});
  let nodes = JSON.parse(dataflowGraph.nodes);

  Job.findOne({where: {id: req.body.jobId}, attributes: {exclude: ['assetId']}}).then(async (savedJob) => {
    let jobUpdated = await Job.update({
      dataflowId: req.body.dataflowId
    }, {where: {id: req.body.jobId}});

    let mousePos = req.body.mousePosition.split(',');
    let job = {};
    job.basic = {
      "title": savedJob.name,
      "id": req.body.currentlyEditingId,
      "x": parseInt(mousePos[0]),
      "y": parseInt(mousePos[1]),
      "clusterId": savedJob.cluster_id,
      "application_id": req.body.application_id,
      "dataflowId": req.body.dataflowId,
      "jobId": req.body.jobId
    }
    job.mousePosition = mousePos;

    let wuid = await hpccUtil.getJobWuidByName(savedJob.cluster_id, savedJob.name);

    let jobInfo = await hpccUtil.getJobInfo(savedJob.cluster_id, wuid, savedJob.jobType);

    updateFileRelationship(req.body.jobId, job, jobInfo.jobfiles, [], nodes).then((results) => {
      res.json(results);
    })
  }).catch((err) => {
    console.log(err);
    return res.status(500).send("Error occured while creating file relation");
  })
});

router.post('/refreshDataflow', [
  body('dataflowId').isUUID(4).withMessage('Invalid dataflow id'),
  body('application_id').isUUID(4).withMessage('Invalid application id'),
], async (req, res) => {
  //#1 - get jobs associated with a dataflow
  //#2 - iterate through jobs and get latest info from cluster and update jobfile table
  //#3 - once job file is updated, for each job, call updateFileRelationsship
  let promises=[];
  let dataflowGraph = await DataflowGraph.findOne({where: {dataflowId: req.body.dataflowId}});
  let nodes = JSON.parse(dataflowGraph.nodes);

  let query = 'select j.id, j.name, j.cluster_id, j.jobType from job j, assets_dataflows ad where ad.dataflowId=(:dataflowId) and ad.assetId = j.id';
  let replacements = { dataflowId: req.body.dataflowId};
  let jobs = await models.sequelize.query(query, {
    type: models.sequelize.QueryTypes.SELECT,
    replacements: replacements
  })

  try {
    jobs.forEach((job) => {
      promises.push(hpccUtil.getJobWuidByName(job.cluster_id, job.name).then((wuid) => {
        return hpccUtil.getJobInfo(job.cluster_id, wuid, job.jobType).then(async (jobInfo) => {
          let jobObj = {}, jobFiles=[];
          let dataflowJobNode = nodes.filter(node => node.jobId == job.id);
          if(dataflowJobNode && dataflowJobNode.length > 0) {
            console.log(jobInfo)
            jobObj.files = jobInfo.jobfiles;
            jobObj.params = [];
            jobObj.basic = {
              "title": job.name,
              "id": dataflowJobNode[0].id,
              "clusterId": job.cluster_id,
              "application_id": req.body.application_id,
              "dataflowId": req.body.dataflowId,
              "jobId": job.id
            }
            console.log("**************************"+job.name+"*******************"+job.id)
            jobObj.mousePosition = [dataflowJobNode[0].x, dataflowJobNode[0].y];
            return updateJobDetails(req.body.application_id, job.id, jobObj, true, nodes, req.body.dataflowId);
          }
        })
      }))
    })

    Promise.all(promises).then(async () => {
      console.log("refresh completed....")
      let dataflowGraph = await DataflowGraph.findOne({where: {dataflowId: req.body.dataflowId}});
      let newNodes = JSON.parse(dataflowGraph.nodes);
      console.log(nodes.length, newNodes.length);
      res.json({"result": "success"});
    }).catch((err) => {
      console.log(err);
      return res.status(500).json({ success: false, message: "Error occured while refreshing the job" });
    })
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Error occured while refreshing the job" });
  }
})

router.post('/saveJob', [
  body('id')
  .optional({checkFalsy:true})
    .isUUID(4).withMessage('Invalid id'),
  body('job.basic.application_id')
    .isUUID(4).withMessage('Invalid application id'),
  body('job.basic.name')
  .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_.\-:]*$/).withMessage('Invalid name'),
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

      let response = await updateJobDetails(applicationId, jobId, req.body.job, req.body.job.autoCreateFiles, [], req.body.job.basic.dataflowId).catch((err) => {
        console.log("Error occured in updateJobDetails....")
        return res.status(500).json({ success: false, message: "Error occured while saving the job" });
      });

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
            await JobScheduler.removeJobFromScheduler(req.body.job.basic.name + '-' + req.body.job.basic.dataflowId + '-' + jobId);
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

              //remove existing job with same name
              try {
                await JobScheduler.removeJobFromScheduler(req.body.job.basic.name + '-' + req.body.job.basic.dataflowId + '-' + jobId);
                await JobScheduler.addJobToScheduler(
                  req.body.job.basic.name,
                  cronExpression,
                  req.body.job.basic.cluster_id,
                  req.body.job.basic.dataflowId,
                  applicationId,
                  jobId,
                  req.body.job.basic.jobType == 'Script' ? SUBMIT_SCRIPT_JOB_FILE_NAME : SUBMIT_JOB_FILE_NAME,
                  req.body.job.basic.jobType
                )
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
              await JobScheduler.removeJobFromScheduler(req.body.job.basic.name + '-' + req.body.job.basic.dataflowId + '-' + jobId);
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
    return res.json(response);
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
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[job list/read.js] - Get job list for app_id = " + req.query.app_id);
  try {
    let dataflowId = req.query.dataflowId;
    let query = 'select j.id, j.name, j.title, j.jobType, j.description, j.createdAt from job j '+
    'where j.id not in (select asd.assetId from assets_dataflows asd where asd.dataflowId = (:dataflowId) and asd.deletedAt is null)'+    
    'and j.application_id = (:applicationId)'+
    'and j.deletedAt is null;';
    /*let query = 'select j.id, j.name, j.title, j.createdAt, asd.dataflowId from job j, assets_dataflows asd where j.application_id=(:applicationId) '+
        'and j.id = asd.assetId and j.id not in (select assetId from assets_dataflows where dataflowId = (:dataflowId))';*/
    let replacements = { applicationId: req.query.app_id, dataflowId: dataflowId};
    let existingFile = models.sequelize.query(query, {
      type: models.sequelize.QueryTypes.SELECT,
      replacements: replacements
    }).then((jobs) => {
      res.json(jobs);
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Error occured while retrieving jobs" });
    });
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while retrieving jobs" });
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

        if(isStoredOnGithub && !ecl && jobStatus === 'completed' ) { 
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
            console.log('--FAILED TO UPDATE ECL----------------------------------------');
            console.dir(error, { depth: null });
          }
        }

        var jobData = job.get({ plain: true });
        for (jobFileIdx in jobData.jobfiles) {
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
        JobExecution.destroy({
          where:{ jobId: req.body.jobId }
        }).then(async (jobExecutionDeleted) => {
          await AssetDataflow.destroy({ where: { assetId: req.body.jobId } });
          res.json({"result":"success"});
        })
      });
    });
  }).catch(function(err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Error occured while deleting the job" });
  });
});

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
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_.\-:]*$/).withMessage('Invalid job name'),
], async (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
    let wuid = '';
    let job = await Job.findOne({where: {id:req.body.jobId}, attributes: {exclude: ['assetId']}, include: [JobParam]});
    const isStoredOnGithub = job.metaData?.isStoredOnGithub;
    if(job.jobType == 'Spray') {
      let sprayJobExecution = await hpccUtil.executeSprayJob(job);
      wuid = sprayJobExecution.SprayResponse && sprayJobExecution.SprayResponse.Wuid ? sprayJobExecution.SprayResponse.Wuid : ''
    } else if(job.jobType == 'Script') {
      let executionResult = await assetUtil.executeScriptJob(req.body.jobId);
    } else if(job.jobType != 'Script' && job.jobType != 'Spray') {
      if (isStoredOnGithub){
        wuid = await hpccUtil.createWorkUnit(req.body.clusterId); // creates empty WU, this is needed to update and submit WU after repo from git is cloned
      } else {
        wuid = await hpccUtil.getJobWuidByName(req.body.clusterId, req.body.jobName);
        let wuResubmitResult = await hpccUtil.resubmitWU(req.body.clusterId, wuid);
      }
    } 
    //record workflow execution
    let jobExecutionId;
    await JobExecution.findOrCreate({
      where: {
        jobId: req.body.jobId,
        applicationId: req.body.applicationId
      },
      defaults: {
        jobId: req.body.jobId,
        dataflowId: req.body.dataflowId,
        applicationId: req.body.applicationId,
        wuid: wuid,
        clusterId: req.body.clusterId,
        status: 'submitted'
      }
    }).then((results, created) => {
      jobExecutionId = results[0].id;
      if(!created) {
        return JobExecution.update({
          jobId: req.body.jobId,
          dataflowId: req.body.dataflowId,
          applicationId: req.body.applicationId,
          wuid: wuid,
          status: 'submitted'
        },
        {where: {id: jobExecutionId}})
      }
    })
    res.json({"success":true});
    if (isStoredOnGithub){
      const tasks =  await hpccUtil.pullFilesFromGithub( wuid,req.body.jobName ,req.body.clusterId, job.metaData.gitHubFiles );
      if (tasks.WUaction?.failedToUpdate) {
          // Failed to update WU action to status 'failed', status polled keep polling this wu, manually update JobExecution and notify job failure.
        try {
          await JobExecution.update({status: 'failed'}, {where: {id: jobExecutionId}});
          workflowUtil.notifyJobFailure(job.name,req.body.clusterId, wuid)
        } catch (error) {
          console.log('------------------------------------------');
          console.log("Failed to notify", error);
        }
      }
      console.log('GitHub Flow Summary-----------------------------------------');
      console.dir(tasks, { depth: null });
    }
  } catch (err) {
    console.error('err', err);
    return res.status(500).json({ success: false, message: "Error occured while re-submiting the job" });
  }
});

router.get('/jobExecutionDetails', [
  query('dataflowId')
    .isUUID(4).withMessage('Invalid datafow id'),
  query('applicationId')
    .isUUID(4).withMessage('Invalid application id'),
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[jobExecutionDetails] - Get jobExecutionDetails for app_id = " + req.query.applicationId);
  try {
    let query = 'select je.id, je.jobId as task, je.dataflowId, je.applicationId, je.status, je.wuid, je.wu_duration, je.clusterId, je.updatedAt, j.name from '+
            'job_execution je, job j '+
            'where je.dataflowId = (:dataflowId) and je.applicationId = (:applicationId) and j.id = je.jobId';
    let replacements = { applicationId: req.query.applicationId, dataflowId: req.query.dataflowId};
    let jobExecution = models.sequelize.query(query, {
      type: models.sequelize.QueryTypes.SELECT,
      replacements: replacements
    }).then((jobExecution) => {
      res.json(jobExecution);
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Error occured while retrieving Job Execution Details" });
    });
  } catch (err) {
    console.error('err', err);
    return res.status(500).json({ success: false, message: "Error occured while retrieving Job Execution Details" });
  }
});

const QueueDaemon = require('../../queue-daemon');

router.get('/msg', (req, res) => {
  if (req.query.topic && req.query.message) {
    QueueDaemon.submitMessage(req.query.topic, req.query.message);
    return res.json({ topic: req.query.topic, message: req.query.message });
  }
});

function updateCommonData(objArray, fields) {
    Object.keys(fields).forEach(function (key, index) {
        objArray.forEach(function(obj) {
            obj[key] = fields[key];
        });
    });
    return objArray;
}

let sortFiles = (files) => {
  return files.sort((a, b) => (a.name > b.name) ? 1 : -1);
}

module.exports = router;