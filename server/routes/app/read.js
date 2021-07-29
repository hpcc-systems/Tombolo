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
const File = models.file;
const Index = models.indexes;
const Query = models.query;
const Job = models.job;
const Dataflow = models.dataflow;
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

//Import application ################
let upload = multer();
upload = multer({ dest: 'uploads/'})
let allPromises = [];

// Remove file
const removeFile = (filePath) => {
    fs.unlink(filePath, (err) =>{
      if(err){
        console.log("Error Deleting file", err)
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

//Emmit message with socket io
const emmitUpdates = (io, message) => {
  return io.emit("message", JSON.stringify(message));
}
 //1. #### import root groups 
 function importRootGroups(newAppId,importingGroups,groupIdMap,numberOfAttemptedImport, assetData, io, res){
  let promises = [];
  emmitUpdates(io, {step : "Importing root groups", status: "normal"})
  importingGroups.map((item, index) =>{
    if(item.parent_group == ""){
      item.doneImportingGroup = true;
      numberOfAttemptedImport++;

      promises.push(Groups.create({
        name: importingGroups[index].name,
        description: importingGroups[index].description,
        application_id: newAppId,
        parent_group: ""
      })
      .then(data =>{
        groupIdMap.push({staleId: item.id, newId:  data.dataValues.id});
        emmitUpdates(io, {step : `SUCCESS- importing ${data.dataValues?.name} `, status: "success"})
        // return data;
      }).catch (err => {
        emmitUpdates(io, {step : `ERR- importing ${data.dataValues?.name} `, status: "error"})
        console.log("<< err", err)
      })
      )
    }
  })
  Promise.all(promises).then(result =>{
    emmitUpdates(io, {step : `Done importing root groups`, status: "normal"})
    emmitUpdates(io, {step : `Importing child groups`, status: "normal"})
    importChildGroups(newAppId,importingGroups,groupIdMap,numberOfAttemptedImport, assetData, io, res);
  })
}


//2 #### import child groups & assets 
function importChildGroups(newAppId,importingGroups,groupIdMap,numberOfAttemptedImport, assetData,io, res){
  let importChildGroupsPromise = [];
  if(importingGroups.length !== numberOfAttemptedImport){
    importingGroups.map((item, index) => {
      if(!item.doneImportingGroup){
      let indexOfObject = groupIdMap.findIndex(element => element["staleId"] == item.parent_group)
        if(indexOfObject != -1){
          item.doneImportingGroup = true;
          numberOfAttemptedImport++;
          console.log("<<<<<<<<<<<<<<<<<<<<<< New group ID ", groupIdMap[indexOfObject] )

          importChildGroupsPromise.push(
            Groups.create({
              name: importingGroups[index].name,
              description: importingGroups[index].description,
              application_id: newAppId,
              parent_group: groupIdMap[indexOfObject].newId,
            })
            .then(data =>{
              emmitUpdates(io, {step : `SUCCESS - importing ${data.dataValues?.name} `, status: "success"});
              groupIdMap.push({staleId: item.id, newId: data.dataValues.id});
              return data;
            }).catch((err) =>{
              emmitUpdates(io, {step : `ERR - importing ${index.name} `, status: "success"})
              console.log("ERR -", err)
            })
          )

        }
      }
    })
      }
      
      
    Promise.all(importChildGroupsPromise).then(result =>{
      //Attempt to import all the groups if done importing - start importing assets
      if(numberOfAttemptedImport == importingGroups.length){
        emmitUpdates(io, {step : `Done importing groups`, status: "normal"})
        emmitUpdates(io, {step : "Importing all assets", status: "normal"})
        let importAllAssets = new Promise(function(resolve, reject){
          resolve(importAssets(assetData, newAppId, groupIdMap, io));
        });
        importAllAssets
          .then(result =>{
            Promise.all([allPromises]).then(result =>{
              emmitUpdates(io, {step : "SUCCESS - Application import complete", status: "success"})
              res.status(200).json({success : true, message : "Import complete", appId : newAppId})
            })
          })
          .catch(err =>{
            console.log(err)
          })
      }else{
        importChildGroups(newAppId,importingGroups,groupIdMap,numberOfAttemptedImport, assetData,io, res)
      }
    })
}



// Fuction maps through assets and use switch to import
function importAssets(assetData, newAppId, groupIdMap, io){
   assetData.map(item => {
    switch(item[0]){
        case "files":
          return importAssetDetails(item, assetType = File, newAppId, groupIdMap, io);
          
        case "indexes" :
          return importAssetDetails(item, assetType = Index, newAppId, groupIdMap, io);
          
        case "queries" :
          return importAssetDetails(item, assetType = Query, newAppId, groupIdMap, io);
          
        case "jobs" : 
        return   importAssetDetails(item, assetType = Job, newAppId, groupIdMap, io);
        
        case "dataflow" :  
          return importAssetDetails(item, assetType = Dataflow, newAppId, groupIdMap, io);
    }
  })
}

// Function to import asset details, asset groups, asset_dataflows/ depend on jobs
function importAssetDetails(item , assetType, newAppId, groupIdMap, io){
  item[1].map(asset =>{
  let newAsset;
  asset.application_id = newAppId;
  allPromises.push(
    assetType.create(asset)
      .then(result => {
        newAsset = result;
        emmitUpdates(io, {step : `SUCCESS - importing ${item[0]} ${asset.title} `, status: "success"})
        //create asset Groups
          if(asset.groups?.length > 0){
            asset.groups.map( assetGroupItem => {
              //Get new group id
            let newGroupId = groupIdMap.filter(item => item.staleId === assetGroupItem.id)[0].newId
              AssetGroups.create({assetId : result.id, groupId: newGroupId}).then(result =>{
                emmitUpdates(io, {step : `SUCCESS - creating asset group ${result.id} `, status: "success"})
              }).catch(err => {
                emmitUpdates(io, {step : `ERR - creating asset group` , status: "error"});
                console.log("ERR -", err)
              })
            })
          }
         
        })
        .then(() => {
          // #### create asset Dataflows
          asset.dataflows?.map(dataflow => {
            //create asset dataflows
            AssetDataflows.create(dataflow.assets_dataflows)
            .then(result =>{
              emmitUpdates(io, {step : `SUCCESS - creating asset dataflow`, status: "success"})
            }).catch(err =>{
              emmitUpdates(io, {step : `ERR - creating asset dataflows`, status: "error"});
              console.log("ERR -", err)
            })
          })
          })
        .then(() =>{
          // #### Create Depends on Jobs
          asset.dependsOnJobs?.map(job =>{
            DependentJobs.create(job).then(() =>{
              emmitUpdates(io, {step : `SUCCESS - creating depend on job `, status: "success"})

            }).catch(err =>{
              emmitUpdates(io, {step : `ERR - creating depend on job`, status: "error"})
              console.log("ERR -", err)
            })
          })
        })
        .then(() =>{
          // #### create dataflow graph
          if(asset.dataflowgraph){
                Dataflowgraph.create({
                application_id: newAppId,
                nodes:asset.dataflowgraph.nodes,
                edges: asset.dataflowgraph.edges,
                dataflowId: newAsset.id,
              }).then(result => {
                emmitUpdates(io, {step : `SUCCESS - creating dataflow graph`, status: "success"})
              })
              .catch(err =>{
                emmitUpdates(io, {step : `SUCCESS - creating asset group ${result.id} `, status: "success"});
                console.log("ERR -", err)
              })
             
          }
        })
        .catch(error => {
          emmitUpdates(io, {step : `ERR - importing ${item[0]} ${asset.title} `, status: "err"})
          console.log("Err creating asset", error)
        })

  );
  })

}

// #### Import Application Route
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
    const  io = req.app.get('socketio');
    fs.readFile(`uploads/${req.file.filename}`, (err,data) => {
    if(err){
      res.status().send("Unable to read file. Data must be in JSON format")
      return;
    }else{
      emmitUpdates(io, {step : "Extracting data", status : "normal"})
      let parsedData = validateJSON(data, `uploads/${req.file.filename}` )
      if(parsedData === "error"){
        emmitUpdates(io, {step : "ERR - extracting data", status:"error"})
        res.status(404).send({success: false, message: "Unable to read file uploaded. Data must be in JSON format"});
        return;
      }else {
        emmitUpdates(io, {step: "SUCCESS - extracting data", status : "success"})
        emmitUpdates(io, {step: "Validating application data", status: "normal"})
        if(parsedData.application){
        emmitUpdates(io, {step: "SUCCESS -  Validating application data", status : "success"})
          const {application} = parsedData;
          try {
            emmitUpdates(io, {step: "Checking if application name is unique", status : "normal"})
            models.application.findAll({where:{
            creator: req.body.user, title: application.title
            }, order: [['updatedAt', 'DESC']],
            include: [UserApplication]
                }).then(function(applications) {
                  const matchedApp = applications.filter(app => app.title === application.title)
                    if( matchedApp.length > 0){ 
                    // TODO - get new app name or get abort permission
                    emmitUpdates(io, {step : `FAILED - App ${application.title} already exists `, status: "error"})
                    return res.status(409).json({success: false, message: `Application with title ${application.title} already exists `})
                  }else{
                  emmitUpdates(io, {step : "SUCCESS -  Unique application name", status: "success"})
                   
                      emmitUpdates(io, {step : "Validating user ", status : "normal"})
                    let newAppId;
                      if(req.body.user){
                        emmitUpdates(io, {step: "SUCCESS - Validating user credentials", status: "success"})
                        emmitUpdates(io, {step : "Creating application", status: "normal"})
                        //Creating App
                          models.application.create({"title": application.title, "description":application.description, "creator" : req.body.user})
                          .then(function(application) {   
                            newAppId = application.id;
                            emmitUpdates(io, {step : "SUCCESS - Creating application", status: "success"})
                        }).
                        then(() =>{
                           //Importing groups to newly created App
                           let importingGroups = parsedData.application.groups;
                           emmitUpdates(io, {step : "Parsing group data", status: "normal"})
                           const assetData =  Object.entries(parsedData.application.assets);
                           emmitUpdates(io, {step : "Done parsing group data", status: "normal"})

                           let groupIdMap = [];
                           let numberOfAttemptedImport=0;
                           importRootGroups(newAppId,importingGroups,groupIdMap,numberOfAttemptedImport, assetData, io, res)  
                         
                        })
                        .catch(err =>{
                            emmitUpdates(io, {step : `ERR- Creating application`, status: "error"})
                            console.log("Error creating app <<<< " , err)
                            return res.status(400).json({success: false, message: "Unable to create application"})
                        })          
                    }
                      else{
                        emmitUpdates(io, {step : `ERR- validating permission`, status: "error"})
                        return res.status(400).json({ success: false, message: "Inadquate permission" });        
                      }
                  }
            })
            .catch(function(err) {
              console.log(err);
              return res.status(500).json({ success: false, message: "Error occured while getting application list" });
            });
          } catch (err) {
            console.log('err', err);
            return res.status(500).json({ success: false, message: "Error occured while getting application list" });
          }
        }
        else{
          //File uploaded does not have app ID
          emmitUpdates(io, "ERR -  Validating application data")
          return res.status(404).send({success: false, message: "Unable to read file uploaded. Data must be in JSON format"});
        }
      }}
})
});

module.exports = router;