const express = require('express');
const router = express.Router();
const assert = require('assert');[]
var models  = require('../../models');
let UserApplication = models.user_application;
let Application = models.application;
const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator');
const NotificationModule = require('../notifications/email-notification');
const authServiceUtil = require('../../utils/auth-service-utils');
let Sequelize = require('sequelize');
const Op = Sequelize.Op;
const multer = require('multer');
const fs = require('fs');
const { INSPECT_MAX_BYTES } = require('buffer');
const File = models.file;
const Index = models.indexes;
const Query = models.query;
const Job = models.job;
const DataFlow = models.dataflow;
const WebSocket = require('ws');
const { count } = require('console');
const { SIGSTOP } = require('constants');
const { create } = require('domain');
const Groups = models.groups;
const AssetGroups = models.assets_groups;
const AssetDataflows = models.assets_dataflows;
const Dataflowgraph = models.dataflowgraph;
const DependentJobs = models.dependent_jobs;



router.get('/app_list', (req, res) => {
  console.log("[app/read.js] - App route called");

  try {
    models.application.findAll({order: [['updatedAt', 'DESC']]}).then(function(applications) {
        res.json(applications);
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Error occured while getting application list" });
    });
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while getting application list" });
  }
});
router.get('/appListByUserId', (req, res) => {
  console.log("[app/read.js] -  Get app list for user id ="+ req.query.user_id);

  try {
    models.application.findAll({where:{
      [Op.or]: [
        {"$user_id$":req.query.user_id},
        {"$user_id$": req.query.user_name}
      ]
    }, order: [['updatedAt', 'DESC']],
    include: [UserApplication]
        }).then(function(applications) {
        res.json(applications);
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Error occured while getting application list" });
    });
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while getting application list" });
  }
});

router.get('/app', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id')
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[app/read.js] - App route called: "+req.query.app_id);

  try {
    models.application.findOne({
        where: {"id":req.query.app_id}
    }).then(function(application) {
        res.json(application);
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Error occured while getting application details" });
    });
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while getting application details" });
  }
});

router.post('/newapp', [
  body('user_id')
    .optional({checkFalsy:true})
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid user_id'),
  body('title')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid title'),
  body('description')
    .optional({checkFalsy:true}),
  body('creator')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid creator'),
],function (req, res) {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
    if(req.body.id == '') {
      models.application.create({"title":req.body.title, "description":req.body.description, "creator": req.body.creator}).then(function(application) {
        if(req.body.user_id)
          models.user_application.create({"user_id":req.body.user_id, "application_id":application.id}).then(function(userapp) {
          res.json({"result":"success", "id": application.id});
        });
      else
          res.json({"result":"success", "id": application.id});
      });
    } else {
      models.application.update(req.body, {where:{id:req.body.id}}).then(function(result){
          res.json({"result":"success", "id": result.id});
      })
    }
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while creating application" });
  }
});

router.post('/removeapp', function (req, res) {
  try {
      models.application.destroy({
          where:{id: req.body.appIdsToDelete}
      }).then(function(deleted) {
          return res.status(200).send({"result":"success"});
      });
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while removing application" });
  }
});

router.post('/saveUserApp', function (req, res) {
  console.log("[app/read.js] - saveUserApp called");
  var userAppList=req.body.users;
  try {
    UserApplication.bulkCreate(userAppList).then(async function(application) {
      let userDetail = await authServiceUtil.getUserDetails(req, userAppList[0].user_id);
      Application.findOne({where: {id:userAppList[0].application_id}}).then((application) => {
        NotificationModule.notifyApplicationShare(userDetail[0].email, application.title, req);
      })
      res.json({"result":"success"});
    });
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while saving user application mapping" });
  }
});

//Import application #####################################################################################
let upload = multer();
upload = multer({ dest: 'uploads/'})

// Remove file
const removeFile = (filePath) => {
    fs.unlink(filePath, (err) =>{
      if(err){
        console.log("<<<<  Error Deleting file", err)
      }
    }) 
}

//validate JSON
const validateJSON = (data, filePath) =>{
  try{
    var data = JSON.parse(data);
    removeFile(filePath)
    return data;
  }catch(e){
    removeFile(filePath)
    return "error"
  }
}

//import asset and create asset groups
function createAssetsAndAssetGroups(currentItem, groupIdMap, model, newAppId){
  currentItem[1].map(asset =>{
    asset.application_id = newAppId;
    asset.groups.map(item => {
      let indexOfObject = groupIdMap.findIndex(element => element["staleId"] == item.id);
      if(indexOfObject != -1){
        item.id = groupIdMap[indexOfObject].newId;
      }
    })
      model.create(asset).then((newAsset) =>{
          asset.dataflows.map(assetsDataflow =>{
            // <<<<< Dataflow and Dependent Jobs
            if(model !== "dataflow" || "jobs"){
              AssetDataflows.create(assetsDataflow.assets_dataflows)
              .then(data => {
                // <<<< EMMIT Message
                console.log("success <<<<<<<<<<<< Asset data flow created  - indexs/files", data );
                return data;
              })
              .catch(err => { 
                // <<<< EMMIT Message
                console.log("failed <<<<<<<<<<<<<< Asset data flow creation failed - ERR occured while adding asset index/files", err.message)
                return err;
              })
            }else if( model === "jobs"){
             assetsDataflow.dependsOnJobs.map(dependentJob => {
              DependentJobs.create(dependentJob)
              .then(data => {
                // <<<< EMMIT Message
                console.log("success <<<<<<<<<<<< Dependent JOB  - job", data );
                return data;
              })
              .catch(err => { 
                // <<<< EMMIT Message
                console.log("failed <<<<<<<<<<<<<< Dependent JOB - ERR occured while adding dependent job", err.message)
                return err;
              })
             });
            }
          })
        
        // <<<< Asset Groups
        asset.groups.map((item) => {
          if(asset.groups.length > 0){
            AssetGroups.create({
              assetId: newAsset.id,
              groupId: item.id
            }).then( data =>{
                console.log("******************* DATA", data)
                return data;
            }).catch(err =>{
              console.log("******************* ERR", err.message);
              return err.message;
            })
          }
        })
      }).catch(err =>{
        console.log("<<<<<<<<<< issue creating asset", err)
        return err.message;
      })
  })
}


 //import root groups
  function importRootGroups(newAppId,importingGroups,groupIdMap,numberOfAttemptedImport, assetData, io){
    let promises = [];
    importingGroups.map((item, index) =>{
      if(item.parent_group == ""){
        // let message = `importing group ${importingGroups[index].name}`
        // emmitUpdates(io, message)
        item.doneImportingGroup = true;
        numberOfAttemptedImport++;
        console.log("$$$$$$$$$$$$$$$$ root <<<<  Root ", numberOfAttemptedImport , "<<<<<<<", importingGroups.length)
        promises.push( Groups.create({
          name: importingGroups[index].name,
          description: importingGroups[index].description,
          application_id: newAppId,
          parent_group: "",
          importingGroupId: importingGroups[index].id
        }).then(data =>{
          // <<<< EMMIT message
          console.log("s u c e s s  <<<<<<<<<<<<<<<<<<<", `import group ${data.dataValues?.name} sucessful`)
          return data;
        }).catch((err) =>{
          // <<<< EMMIT message
          console.log("F A I L <<<<<<<<<<<<<<<<<<<<",  `import  group ${importingGroups[index].name}, failed-  ${err.message}`)
          return `import ${importingGroups[index].name}, ${err.message}`
        })
        )
      }
    })
    Promise.all(promises).then(result =>{
      result.map(item =>{
        if(item.dataValues){
          let {id, importingGroupId} = item.dataValues
          groupIdMap.push({staleId: importingGroupId, newId: id});
        }  
      })
      importChildGroups(newAppId,importingGroups,groupIdMap,numberOfAttemptedImport, assetData);
    })
}

//import child groups
function importChildGroups(newAppId,importingGroups,groupIdMap,numberOfAttemptedImport, assetData,io){
  let importChildGroupsPromise = [];

  if(importingGroups.length !== numberOfAttemptedImport){
    importingGroups.map((item, index) => {
      if(!item.doneImportingGroup){
      let indexOfObject = groupIdMap.findIndex(element => element["staleId"] == item.parent_group)
        if(indexOfObject != -1){
          item.doneImportingGroup = true;
          numberOfAttemptedImport++;
          importChildGroupsPromise.push(
            Groups.create({
              name: importingGroups[index].name,
              description: importingGroups[index].description,
              application_id: newAppId,
              parent_group: "",
              importingGroupId: importingGroups[index].id,
              parent_group: groupIdMap[indexOfObject].newId
            })
            .then(data =>{
              // <<<< EMMIT message
              console.log("s u c e s s   adding C H I L D <<<<<<<<<<<<<<<<<<<", `import group ${data.dataValues?.name} sucessful`)
              return data;
            }).catch((err) =>{
              // <<<< EMMIT message
              console.log("F A I L adding C H I L D<<<<<<<<<<<<<<<<<<<<",  `import  group ${importingGroups[index].name}, failed-  ${err.message}`)
              return `import ${importingGroups[index].name}, ${err.message}`
            })
          )
        }
      }
    })
      }
      

    Promise.all(importChildGroupsPromise).then(result =>{
      //push new and old id pair into an array
      result.map(item =>{
        let {id, importingGroupId} = item.dataValues;
        groupIdMap.push({staleId: importingGroupId, newId: id});
      })

      //Attempt to import all the groups if done importing - start importing assets
      if(numberOfAttemptedImport == importingGroups.length){
        //Importing assets
        assetData.map(item => {
          switch(item[0]){
            case "files":
              createAssetsAndAssetGroups(item,groupIdMap,File, newAppId)
              return;
            case "indexes" :
              createAssetsAndAssetGroups(item,groupIdMap,Index, newAppId)
              return;
            case "queries" :
              createAssetsAndAssetGroups(item,groupIdMap,Query, newAppId)
              return;
            case "jobs" : 
              createAssetsAndAssetGroups(item,groupIdMap,Job, newAppId)
            return;
            case "dataflow" : 
            item[1].map(dataflow => {
                dataflow.application_id = newAppId;
                  DataFlow.create(dataflow).then((newDataflow) =>{
                  Dataflowgraph.create({
                      application_id: newAppId,
                      nodes:dataflow.dataflowgraph.nodes,
                      edges: dataflow.dataflowgraph.edges,
                      dataflowId: newDataflow.id,
                    });
                    })
            })
              return;
          }
        })
        
      }else{
        importChildGroups(newAppId,importingGroups,groupIdMap,numberOfAttemptedImport, assetData,io)
      }
    })
}

//Emmit message with socket io
const emmitUpdates = (io, message) => {
      return io.emit("message", JSON.stringify(message));
}

router.post('/importApp', [
  body('user_id')
    .optional({checkFalsy:true})
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid user_id'),
  body('title')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid title'),
  body('description')
    .optional({checkFalsy:true}),
  body('creator')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid creator'),
], upload.single("file"), function (req, res) {
  // ###########################################
    const  io = req.app.get('socketio');
  // ###########################################


  fs.readFile(`uploads/${req.file.filename}`, (err,data) => {
  if(err){
    res.status().send("Unable to read file. Data must be in JSON format")
    return;
  }else{
    emmitUpdates(io, {step : "Extracting data", status : "normal"})
    let parsedData = validateJSON(data, `uploads/${req.file.filename}` )
    if(parsedData === "error"){
      emmitUpdates(io, "ERR - extracting data")
      res.status(404).send({success: false, message: "Unable to read file uploaded. Data must be in JSON format"});
      return;
    }else {
      emmitUpdates(io, "SUCCESS - extracting data")
      emmitUpdates(io, "Validating application data")
      if(parsedData.application){
        emmitUpdates(io, "SUCCESS -  Validating application data")
        const {application} = parsedData;
        try {
          emmitUpdates(io, "Checking if application name is unique")
          models.application.findAll({where:{
          creator: req.body.user, title: application.title
          }, order: [['updatedAt', 'DESC']],
          include: [UserApplication]
              }).then(function(applications) {
                const matchedApp = applications.filter(app => app.title === application.title)
                  if( matchedApp.length > 0){ 
                  // TODO - get new app name or get abort permission
                  emmitUpdates(io, `FAILED - Application with title ${application.title} already exists `)
                  res.status(409).json({success: false, message: `Application with title ${application.title} already exists `})
                }else{
                  emmitUpdates(io, "SUCCESS -  Unique application name")
                  try {
                    //<<<<<<
                    emmitUpdates(io, "Validating user credentials")
                   let newAppId;
                    if(req.body.user){
                      emmitUpdates(io, "SUCCESS - Validating user credentials")
                      emmitUpdates(io, "Creating application")
                       //Creating App
                        models.application.create({"title": application.title, "description":application.description, "creator" : req.body.user}).then(function(application) {   
                        newAppId = application.id;
                        //Importing groups to newly created App
                        let importingGroups = parsedData.application.groups;
                        const assetData =  Object.entries(parsedData.application.assets);
                        let groupIdMap = [];
                        let numberOfAttemptedImport=0;
                        importRootGroups(newAppId,importingGroups,groupIdMap,numberOfAttemptedImport, assetData, io).then(result =>{
                          
                        })
                     }).catch(err =>{
                        // unable to create application send feedback
                     }) 
                       //Sample response
                       setTimeout(() => {
                        console.log("Done <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
                          res.status(200).json({success : true, message : "Success importing app", appId : newAppId, appTitle: application.title})
                        }, 5000)
                      
                  }
                    else
                    return res.status(400).json({ success: false, message: "Inadquate permission" });        
                } catch (err) {
                  console.log('err', err);
                  // <<<< Issue creating application - app with same name already exists
                  return res.status(500).json({ success: false, message: "Error occured while creating application" });
                }
                }
          })
          .catch(function(err) {
            console.log(err);
            return res.status(500).json({ success: false, message: "Error occured while getting application list" });
          });
        } catch (err) {
          console.log('err', err);
          // <<<< send update to client
          return res.status(500).json({ success: false, message: "Error occured while getting application list" });
        }
      }
      else{
        //File uploaded does not have app ID
        emmitUpdates(io, "FAILED -  Validating application data")
        res.status(404).send({success: false, message: "Unable to read file uploaded. Data must be in JSON format"});
      }
    }}
})
});

module.exports = router;