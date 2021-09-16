const express = require('express');
const router = express.Router();
const assert = require('assert');[]
var path = require('path');
var fs = require('fs');
var models  = require('../../models');
let UserApplication = models.user_application;
let Application = models.application;
let AssetsGroups=models.assets_groups;
let AssetsDataflows=models.assets_dataflows;
let DependentJobs=models.dependent_jobs;
let Groups = models.groups;
let File = models.file;
let FileLayout = models.file_layout;
let FileLicense = models.file_license;
let FileValidation = models.file_validation;
let Index = models.indexes;
let IndexKey = models.index_key;
let IndexPayload = models.index_payload;
let Job = models.job;
let JobFile = models.jobfile;
let JobParam = models.jobparam;
let Query = models.query;
let QueryField = models.query_field;
let Dataflow = models.dataflow;
let DataflowGraph = models.dataflowgraph;
const {socketIo : io} = require('../../server');
const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator');
const NotificationModule = require('../notifications/email-notification');
const authServiceUtil = require('../../utils/auth-service-utils');
let Sequelize = require('sequelize');
const Op = Sequelize.Op;
const multer = require('multer');
const AssetGroups = models.assets_groups;
const AssetDataflows = models.assets_dataflows;
const Dataflowgraph = models.dataflowgraph;

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

router.post('/removeapp', async function (req, res) {
  try {
    let dataflows = await Dataflow.findAll({where: {application_id: req.body.appIdsToDelete}, raw: true, attributes: ['id']});
    if(dataflows && dataflows.length > 0) {
      let dataflowIds = dataflows.map(dataflow => dataflow.id);

      let assetsDataflows = await AssetsDataflows.destroy({where: {id: {[Sequelize.Op.in]:dataflowIds}}});
      let dependantJobs = await DependentJobs.destroy({where: {id: {[Sequelize.Op.in]:dataflowIds}}});
      let dataflowsDeleted = await Dataflow.destroy({where: {application_id: req.body.appIdsToDelete}});
    }
    
    Application.destroy({
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
  const isFileNameValid = /^[a-zA-Z0-9/]*$/.test(filePath);
  if(!isFileNameValid){
    emitUpdates(io, {step : "ERR - Invalid file name or type", status:"error"})
  }
    fs.unlink(filePath, (err) =>{
      console.log("Deleting bad file <<<<<<<<<<<<<<<<<")
      if(err){
        console.log("Error Deleting file", err)
      }
    }) 
}

//validate JSON
const validateJSON = (data, filePath) =>{
  console.log("<<<<<<<<<<<<<<<<<<<<<<<< Deleting file")
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
const emitUpdates = (io, message) => {
  return io.emit("message", JSON.stringify(message));
}
 //1. #### import root groups 
 function importRootGroups(newAppId,importingGroups,groupIdMap,numberOfAttemptedImport, assetData, io, res, app){
  let promises = [];
  emitUpdates(io, {step : "Importing root groups", status: "normal"})
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
        emitUpdates(io, {step : `SUCCESS- importing ${data.dataValues?.name} `, status: "success"})
        // return data;
      }).catch (err => {
        emitUpdates(io, {step : `ERR- importing ${data.dataValues?.name} `, status: "error"})
        console.log("<< err", err)
      })
      )
    }
  })
  Promise.all(promises).then(result =>{
    emitUpdates(io, {step : `Done importing root groups`, status: "normal"})
    emitUpdates(io, {step : `Importing child groups`, status: "normal"})
    importChildGroups(newAppId,importingGroups,groupIdMap,numberOfAttemptedImport, assetData, io, res, app);
  })
}


//2 #### import child groups & assets 
function importChildGroups(newAppId,importingGroups,groupIdMap,numberOfAttemptedImport, assetData,io, res, app){
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
              parent_group: groupIdMap[indexOfObject].newId,
            })
            .then(data =>{
              emitUpdates(io, {step : `SUCCESS - importing ${data.dataValues?.name} `, status: "success"});
              groupIdMap.push({staleId: item.id, newId: data.dataValues.id});
              return data;
            }).catch((err) =>{
              emitUpdates(io, {step : `ERR - importing ${index.name} `, status: "success"})
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
        emitUpdates(io, {step : `Done importing groups`, status: "normal"})
        emitUpdates(io, {step : "Importing all assets", status: "normal"})
        let importAllAssets = new Promise(function(resolve, reject){
          resolve(importAssets(assetData, newAppId, groupIdMap, io));
        });
        importAllAssets
          .then(result =>{
            Promise.all([allPromises]).then(result =>{
              emitUpdates(io, {step : "SUCCESS - Application import complete", status: "success"})
              res.status(200).json({success : true, message : "Import complete", appId : newAppId, app})
            })
          })
          .catch(err =>{
            console.log(err)
          })
      }else{
        importChildGroups(newAppId,importingGroups,groupIdMap,numberOfAttemptedImport, assetData,io, res, app)
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
        emitUpdates(io, {step : `SUCCESS - importing ${item[0]} ${asset.title} `, status: "success"})
        //create asset Groups
          if(asset.groups?.length > 0){
            asset.groups.map( assetGroupItem => {
              //Get new group id
            let newGroupId = groupIdMap.filter(item => item.staleId === assetGroupItem.id)[0].newId
              AssetGroups.create({assetId : result.id, groupId: newGroupId}).then(result =>{
                emitUpdates(io, {step : `SUCCESS - creating asset group ${result.id} `, status: "success"})
              }).catch(err => {
                emitUpdates(io, {step : `ERR - creating asset group` , status: "error"});
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
              emitUpdates(io, {step : `SUCCESS - creating asset dataflow`, status: "success"})
            }).catch(err =>{
              emitUpdates(io, {step : `ERR - creating asset dataflows`, status: "error"});
              console.log("ERR -", err)
            })
          })
          })
        .then(() =>{
          // #### Create Depends on Jobs
          asset.dependsOnJobs?.map(job =>{
            DependentJobs.create(job).then(() =>{
              emitUpdates(io, {step : `SUCCESS - creating depend on job `, status: "success"})

            }).catch(err =>{
              emitUpdates(io, {step : `ERR - creating depend on job`, status: "error"})
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
                emitUpdates(io, {step : `SUCCESS - creating dataflow graph`, status: "success"})
              })
              .catch(err =>{
                emitUpdates(io, {step : `SUCCESS - creating asset group ${result.id} `, status: "success"});
                console.log("ERR -", err)
              })
             
          }
        })
        .catch(error => {
          emitUpdates(io, {step : `ERR - importing ${item[0]} ${asset.title} `, status: "err"})
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

    const{ filename, originalname, mimetype} = req.file; 
    console.log("<<<<<<<<< ",  filename, originalname, mimetype)
    
     const isFileNameValid = /^[a-zA-Z0-9,(\)-_ ]*[.]{0,1}[a-zA-Z,(\)-_]*$/.test(filename);
    if(!isFileNameValid || mimetype !== "application/json"){
      removeFile(`uploads/${filename}`)
      emitUpdates(io, {step : "ERR - Invalid file name or type", status:"error"})
      return res.status(500).json({ success: false, message: "Invalid file name or format" });
    }

    fs.readFile(`uploads/${filename}`, (err,data) => {
    if(err){
      return res.status(500).json({ success: false, message: "Error occured while importing application" });
    }else{
      emitUpdates(io, {step : "Extracting data", status : "normal"})
      let parsedData = validateJSON(data, `uploads/${filename}` )
      if(parsedData === "error"){
        emitUpdates(io, {step : "ERR - extracting data", status:"error"})
        res.status(404).send({success: false, message: "Unable to read file uploaded. Data must be in JSON format"});
        return;
      }else {
        emitUpdates(io, {step: "SUCCESS - extracting data", status : "success"})
        emitUpdates(io, {step: "Validating application data", status: "normal"})
        if(parsedData.application){
        emitUpdates(io, {step: "SUCCESS -  Validating application data", status : "success"})
          const {application} = parsedData;
          try {
            emitUpdates(io, {step: "Checking if application name is unique", status : "normal"})
            models.application.findAll({where:{
            creator: req.body.user, title: application.title
            }, order: [['updatedAt', 'DESC']],
            include: [UserApplication]
                }).then(function(applications) {
                  const matchedApp = applications.filter(app => app.title === application.title)
                    if( matchedApp.length > 0){ 
                    
                    emitUpdates(io, {step : `FAILED - App ${application.title} already exists `, status: "error"})
                    return res.status(409).json({success: false, message: `Application with title ${application.title} already exists `})
                  }else{
                  emitUpdates(io, {step : "SUCCESS -  Unique application name", status: "success"})
                   
                      emitUpdates(io, {step : "Validating user ", status : "normal"})
                    let newAppId;
                      if(req.body.user){
                        emitUpdates(io, {step: "SUCCESS - Validating user credentials", status: "success"})
                        emitUpdates(io, {step : "Creating application", status: "normal"})
                        //Creating App
                          models.application.create({"title": application.title, "description":application.description, "creator" : req.body.user})
                          .then(function(application) {   
                            newAppId = application.id;
                            emitUpdates(io, {step : "SUCCESS - Creating application", status: "success"})
                        }).
                        then(() =>{
                           //Importing groups to newly created App
                           let importingGroups = parsedData.application.groups;
                           emitUpdates(io, {step : "Parsing group data", status: "normal"})
                           const assetData =  Object.entries(parsedData.application.assets);
                           emitUpdates(io, {step : "Done parsing group data", status: "normal"})

                           let groupIdMap = [];
                           let numberOfAttemptedImport=0;
                           const app = {
                             newAppId,
                             appTitle: application.title
                           }
                           importRootGroups(newAppId,importingGroups,groupIdMap,numberOfAttemptedImport, assetData, io, res,app)  
                         
                        })
                        .catch(err =>{
                            emitUpdates(io, {step : `ERR- Creating application`, status: "error"})
                            return res.status(400).json({success: false, message: "Unable to create application"})
                        })          
                    }
                      else{
                        emitUpdates(io, {step : `ERR- validating permission`, status: "error"})
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
          emitUpdates(io, "ERR -  Validating application data")
          return res.status(404).send({success: false, message: "Unable to read file uploaded. Data must be in JSON format"});
        }
      }}
})
});

router.post('/export', [
  body('id').isUUID(4).withMessage('Invalid application id')
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  } 

  try {
    let applicationExport = {};
    Application.findOne({
      where: {id: req.body.id},
    }).then(async (application) => {
      applicationExport = {
        "application" : {
          title: application.title,
          description: application.description,
          cluster: application.cluster
        }

      }      

      let groups = await Groups.findAll({
        where: {application_id: req.body.id},
        attributes: { exclude: ['createdAt', 'updatedAt', 'application_id'] }
      })
      applicationExport.application.groups = groups;
      
      let files = await File.findAll({where: {application_id: application.id}, 
        include: [
          {model: FileLayout, attributes: { exclude: ['createdAt', 'updatedAt', 'id', 'application_id'] }}, 
          {model: FileLicense, attributes: { exclude: ['createdAt', 'updatedAt', 'id', 'application_id'] }}, 
          {model: FileValidation, attributes: { exclude: ['createdAt', 'updatedAt', 'id', 'application_id'] }},
          {model: Groups, as: 'groups', attributes: ['id', 'name', 'description', 'parent_group'], 
          through: {
            attributes: []
          }},
          {model: Dataflow, as: 'dataflows', attributes: ['id']}
        ]      
      }); 

      let indexes = await Index.findAll({where: {application_id: application.id}, 
        include: [
          {model: IndexKey, attributes: { exclude: ['createdAt', 'updatedAt', 'id', 'application_id'] }}, 
          {model: IndexPayload, attributes: { exclude: ['createdAt', 'updatedAt', 'id', 'application_id'] }},
          {model: Groups, as: 'groups', attributes: ['id', 'name', 'description', 'parent_group'], 
          through: {
            attributes: []
          }},
          {model: Dataflow, as: 'dataflows', attributes: ['id']}
        ],
        attributes: { exclude: ['createdAt', 'updatedAt', 'id', 'application_id'] }
      }); 

      let queries = await Query.findAll({where: {application_id: application.id}, 
        include: [
          {model: QueryField, attributes: { exclude: ['createdAt', 'updatedAt', 'id', 'application_id'] }}, 
          {model: Groups, as: 'groups', attributes: ['id', 'name', 'description', 'parent_group'], 
          through: {
            attributes: []
          }},
          {model: Dataflow, as: 'dataflows', attributes: ['id']}
        ],        
        attributes: { exclude: ['createdAt', 'updatedAt', 'id', 'application_id'] }
      }); 

      let jobs = await Job.findAll({where: {application_id: application.id}, 
        include: [
          {model: JobFile, attributes: { exclude: ['createdAt', 'updatedAt', 'id', 'application_id'] }}, 
          {model: JobParam, attributes: { exclude: ['createdAt', 'updatedAt', 'id', 'application_id'] }},
          {model: Groups, as: 'groups', attributes: ['id', 'name', 'description', 'parent_group'], 
          through: {
            attributes: []
          }},
          {model: Dataflow, as: 'dataflows', attributes: ['id']},
          {model: DependentJobs, as: 'dependsOnJobs', attributes: { exclude: ['createdAt', 'updatedAt'], through: {
            attributes: []
          } }}
        ],
        attributes: { exclude: ['createdAt', 'updatedAt', 'id', 'application_id'] }
      }); 

      let dataflow = await Dataflow.findAll({where: {application_id: application.id}, 
        include: [{model: DataflowGraph, attributes: { exclude: ['createdAt', 'updatedAt', 'id', 'application_id'] }}                  
                ],
        attributes: { exclude: ['createdAt', 'updatedAt', 'id', 'application_id'] }
      }); 

      applicationExport.application.assets = {files: files, indexes: indexes, queries: queries, jobs: jobs, dataflow: dataflow};
        
      var schemaDir = path.join(__dirname, '..', '..', 'schemas');
      if (!fs.existsSync(schemaDir)){
        fs.mkdirSync(schemaDir);
      }
      var exportFile = path.join(__dirname, '..', '..', 'schemas', application.title+'-export.json');
      
      fs.appendFile(exportFile, JSON.stringify(applicationExport, null, 4), function (err) {
          if (err) return res.status(500).send("Error occured while exporting application");
          res.download(exportFile, function(err){
            if (err) {
              console.log(err);
              console.log("Error occured during download...")
              res.status(500).send("Error occured while exporting application");;
            } else {
              console.log("Download completed...")
              fs.unlink(exportFile, (err) => {
                if (err) res.status(500).send("Error occured while exporting application");;
                console.log(exportFile + ' was deleted after download');
              });
            }
          });
      });

      //res.json(applicationExport);
    })
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while removing application" });
  }
});

module.exports = router;
