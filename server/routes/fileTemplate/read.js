const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');

let Sequelize = require('sequelize');
const Op = Sequelize.Op;

const models = require('../../models');
const FileTemplate = models.fileTemplate;
const FileMonitoring = models.fileMonitoring;
const FileTemplateLayout = models.fileTemplateLayout;
const FileTemplate_licenses = models.fileTemplate_license;
const AssetsGroups = models.assets_groups;


router.post('/saveFileTemplate', [
    body('id')
    .optional({checkFalsy:true}).isUUID(4).withMessage('Invalid id'),
    body('application_id')
      .isUUID(4).withMessage('Invalid application id'),
    body('cluster')
      .isUUID(4).optional({checkFalsy:true}).withMessage('Invalid cluster id'),
    body('title')
      .isString().optional({checkFalsy:true}).withMessage('Invalid title'),
    body('fileNamePattern')
      .isString().optional({checkFalsy:true}).withMessage('Invalid fileNamePattern'),
    body('searchString')
      .isString().optional({checkFalsy:true}).withMessage('Invalid searchString'),
    body('sampleLayoutFile')
      .isString().optional({nullable: true}).withMessage('Invalid sampleLayoutFile'),
  ], async (req, res) => {
    try {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }

      const {application_id, cluster, title, fileNamePattern, searchString, groupId, description,sampleLayoutFile, fileLayoutData, selectedAsset, licenses, metaData} = req.body;

      if(!selectedAsset.isNew){
        // file template exists -> edit it
        await FileTemplate.update(
          {title, cluster_id : cluster, fileNamePattern, searchString, sampleLayoutFile, description, metaData},
          {where: {id : selectedAsset.id }}
        )
        await FileTemplateLayout.update(
          {fields : {layout : fileLayoutData}},
          {where : {fileTemplate_id : selectedAsset.id}}
        )
        await FileTemplate_licenses.destroy({where : { fileTemplate_id : selectedAsset.id}});
        licenses.forEach(license => {
        license.application_id = application_id;
        license.fileTemplate_id = selectedAsset.id;
        license.license_id = license.id;
      });
        await FileTemplate_licenses.bulkCreate(
        licenses,
        )
        res.status(200).json({success : true, message : `Successfully updated file template -> ${title}`});
      }else{
        //New file template -> Create it
      const fileTemplate = await FileTemplate.create({application_id, title, cluster_id : cluster, fileNamePattern, searchString, sampleLayoutFile, description, metaData });
      if(groupId) await AssetsGroups.create({assetId: fileTemplate.id, groupId});
      await FileTemplateLayout.create({application_id, fileTemplate_id : fileTemplate.id, fields : {layout : fileLayoutData}});
      licenses.forEach(license => {
        license.application_id = application_id;
        license.fileTemplate_id = fileTemplate.id;
        license.license_id = license.id;
      });
      await FileTemplate_licenses.bulkCreate(
        licenses
      )
      res.status(200).json({success : true, message : `Successfully created file template -> ${title}`});
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Error occurred while saving file template details" });
    }
});

// GET FILE TEMPLATE LIST THAT ARE NOT ALREADY ADDED IN THE DATAFLOW
router.get('/fileTemplate_list', [
  query('application_id')
    .isUUID(4).withMessage('Invalid application id'),
  query('dataflowId')
    .isUUID(4).optional({nullable: true}).withMessage('Invalid dataflow id'),
  query('clusterId')
    .isUUID(4).optional({nullable: true}).withMessage('Invalid cluster id')], 
  async(req, res) =>{
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const {application_id , cluster_id} = req.query;
      const assets = await FileTemplate.findAll({
        where:{
          application_id,
          [Op.or]: [
            { cluster_id },
            { cluster_id : null }
          ]
        },
        attributes:['id', 'title', 'metaData', 'description', 'createdAt']
      });
  
      const assetList = assets.reduce( (acc, asset) => {
        const parsed = asset.toJSON();
        if(parsed.metaData?.fileMonitoringTemplate){

          const template  = {
            ...parsed,
            name: parsed.title,
            isAssociated: true,
            isMonitoring: true
          }

          delete template.metaData;
          acc.push(template)
        }
        return acc;
      },[])
  
      res.json(assetList);
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Error occurred while retrieving assets" });  }
  }  
)

router.post('/getFileTemplate',  [
    body('id')
    .optional({checkFalsy:true}).isUUID(4).withMessage('Invalid id'),
    body('application_id')
      .isUUID(4).withMessage('Invalid application id'),
  ], 
  async (req, res) =>{
     let errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }
    try{
      const TemplateResults = await FileTemplate.findOne({where : {id : req.body.id}, include :FileTemplateLayout, raw : true });
      const fileMonitoring = await FileMonitoring.findOne({where : {fileTemplateId : TemplateResults.id}});
      res.status(200).json({...TemplateResults, monitoring : fileMonitoring ? true : false})
    }catch (err){
      console.log(err);
      res.status(500).json({ success : false, message : 'Error occurred while trying to fetch file template details'})
    }
})


router.post('/deleteFileTemplate',[
    body('id')
    .optional({checkFalsy:true}).isUUID(4).withMessage('Invalid id'),
    body('application_id')
      .isUUID(4).withMessage('Invalid application id'),
  ], 
 async(req, res) =>{
    let errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }
    const {id, application_id} = req.body;
    try{
      await FileTemplate.destroy({where : {id, application_id}});
      res.status(200).json({success : true, message : 'File template deleted successfully'})
    }catch(err){
      console.log(err);
      res.status(500).json({success : false, message : 'Unable to delete File Template'})
    }
});

router.post('/getAssociatedLicenses', [
  body('fileTemplate_id').optional({checkFalsy:true}).isUUID(4).withMessage('Invalid File template ID'),
],
async(req, res) =>{
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    const {fileTemplate_id} = req.body;
    try{
      let associateLicenses = await FileTemplate_licenses.findAll({where : {fileTemplate_id}});
      res.status(200).json(associateLicenses)
    }catch(err){
      console.log(err);
      res.status(500).json({success : false, message : 'Unable to get associated licenses'})
    }
    
})

module.exports = router;
