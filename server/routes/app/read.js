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
const { map, indexOf } = require('lodash');
const { INSPECT_MAX_BYTES } = require('buffer');
const File = models.file;
const Index = models.indexes;
const Query = models.query;
const Job = models.job;
const DataFlow = models.dataflow;
const WebSocket = require('ws');
const { count } = require('console');
const { SIGSTOP } = require('constants');
const Groups = models.groups;
const AssetGroups = models.assets_groups;
const AssetDataflows = models.assets_dataflows;



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
      }else{
        console.log("<<<<  File deleted")
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
function createAssetAndAssetGroups(currentItem, groupIdMap, modal, newAppId){
  currentItem[1].map(asset =>{
    asset.application_id = newAppId;
    asset.groups.map(item => {
      let indexOfObject = groupIdMap.findIndex(element => element["staleId"] == item.id);
      if(indexOfObject != -1){
        item.id = groupIdMap[indexOfObject].newId;
      }
    })
    modal.create(asset).then((newAsset) =>{
      asset.groups.map((item) => {
        if(asset.groups.length > 0){
          AssetGroups.create({
            assetId: newAsset.id,
            groupId: item.id
          })
        }
      })
    })
  })
}


 //import root groups
  function importRootGroups(newAppId,importingGroups,groupIdMap,numberOfImportAttemptedGroups, assetData){
  console.log("import function running <<<<<<<");
  //  const testData = assetData;
  try{
    let promises = [];
    importingGroups.map((item, index) =>{
      if(item.parent_group == ""){
        item.doneImportingGroup = true;
        numberOfImportAttemptedGroups++;
        promises.push( Groups.create({
          name: importingGroups[index].name,
          description: importingGroups[index].description,
          application_id: newAppId,
          parent_group: "",
          importingGroupId: importingGroups[index].id
        }))
      }
    })
    Promise.all(promises).then(result =>{
      result.map(item =>{
        let {id, importingGroupId} = item.dataValues
        groupIdMap.push({staleId: importingGroupId, newId: id});
      })
      importChildGroups(newAppId,importingGroups,groupIdMap,numberOfImportAttemptedGroups, assetData);
    })
  }catch(err){
    console.log(">>>>> Err", err, "<<<<<<<< Error")
  } 
}

//import children groups
function importChildGroups(newAppId,importingGroups,groupIdMap,numberOfImportAttemptedGroups, assetData){
  try{
    let promises = [];
    importingGroups.map((item, index) => {
    
      if(!item.doneImportingGroup){
      let indexOfObject = groupIdMap.findIndex(element => element["staleId"] == item.parent_group)
      if(indexOfObject != -1){
        item.doneImportingGroup = true;
        numberOfImportAttemptedGroups++;
        promises.push(
          Groups.create({
            name: importingGroups[index].name,
            description: importingGroups[index].description,
            application_id: newAppId,
            parent_group: "",
            importingGroupId: importingGroups[index].id,
            parent_group: groupIdMap[indexOfObject].newId
          })
        )
      }
      }
    })

    Promise.all(promises).then(result =>{
      console.log( typeof result );
      result.map(item =>{
        let {id, importingGroupId} = item.dataValues
        groupIdMap.push({staleId: importingGroupId, newId: id});
      })
      if(numberOfImportAttemptedGroups === importingGroups.length){
      
        //Importing assets
        assetData.map(item => {
          console.log("<<<<<<<<<<<<<<<<<<<<< Mapping through asset data", assetData.length)
          switch(item[0]){
            case "files":
              createAssetAndAssetGroups(item,groupIdMap,File, newAppId)
              return;
            case "indexes" :
              createAssetAndAssetGroups(item,groupIdMap,Index, newAppId)
              return;
            case "queries" :
              createAssetAndAssetGroups(item,groupIdMap,Query, newAppId)
              return;
            case "jobs" : 
            createAssetAndAssetGroups(item,groupIdMap,Job, newAppId)
            return;
            case "dataflow" : 
            item[1].map(dataflow => {
                dataflow.application_id = newAppId;
                  DataFlow.create(dataflow).then((newDataflow) =>{
                    AssetDataflows.create({
                      dataflowId: newDataflow.id,
                      assetId : "1ac683ab-ad79-4cff-8eac-606d2ac8ff44"
                    })
                    })
            })
              return;
          }
        })
      }
      else{
        importChildGroups(newAppId,importingGroups,groupIdMap,numberOfImportAttemptedGroups, assetData);
      }
    })

  }catch(err){
    console.log("<<<< Error ", err)
  }
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
  fs.readFile(`uploads/${req.file.filename}`, (err,data) => {
  if(err){
    console.log("<<<< <<<<<<<<<< Issue uploading file")
    res.status().send("Unable to read file. Data must be in JSON format")
    return;
  }else{
    console.log("<<<< validating if data is in JSON")
    let parsedData = validateJSON(data, `uploads/${req.file.filename}` )
    if(parsedData === "error"){
      console.log("<<<< <<<<<<<<<< Data is not in JSON format");
      res.status(404).send({success: false, error: "Unable to read file uploaded. Data must be in JSON format"});
      return;
    }else {
      if(parsedData.application){
        console.log("<<<< <<<<<<<<<< Application ID present")
        const {application} = parsedData;
        try {
          console.log(req.body.user, "<<<< User")
          models.application.findAll({where:{
          creator: req.body.user, title: application.title
          }, order: [['updatedAt', 'DESC']],
          include: [UserApplication]
              }).then(function(applications) {
                // console.log("<<<<<<<<<<<<<<<<<<< Mapping", applications)
                // applications.map(item =>console.log("<<<<<<<<<<<<<<<<<<<<< Items ",  item.title))
                const matchedApp = applications.filter(app => app.title === application.title)
                // console.log("<<<< Matched apps ", matchedApp)
                // if( matchedApp.length > 0){
                  if( matchedApp.length > 1000){  // for test only <<<< 
                  //1.c <<<<< App with same title already exists. send upadte to client
                  // TODO - get user input if they want to override existing app and move forward accordingly
                  console.log("<<<< app with this title already exists")
                  // res.status(200).json({success: false, message: `Application with title ${application.title} already exists `})
                
                }else{
                  //1.d <<<< app with same title not found create app - Send update to client
                  console.log("<<<< Unique app title go forward")
                  try {
                    if(req.body.user){
                       //Creating App
                        models.application.create({"title": application.title, "description":application.description, "creator" : req.body.user}).then(function(application) {   
                        const newAppId = application.id;
                        //Importing groups to newly created App
                        let importingGroups = parsedData.application.groups;
                        const assetData =  Object.entries(parsedData.application.assets);
                        let groupIdMap = [];
                        let numberOfImportAttemptedGroups=0;
                        importRootGroups(newAppId,importingGroups,groupIdMap,numberOfImportAttemptedGroups, assetData);
                      })
                      //Sample response
                      return res.send({success : true, message : "Sucess importing app"})
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
        console.log("<<<< No app ID");
        //File uploaded does not have app ID
        res.status(404).send({success: false, error: "Unable to read file uploaded. Data must be in JSON format"});
      }
    }}
})
});
module.exports = router;