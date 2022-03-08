const express = require('express');
const router = express.Router();
const { body,  validationResult } = require('express-validator');

const models = require('../../models');
const FileTemplate = models.fileTemplate;
const FileTemplateLayout = models.fileTemplateLayout;


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
      .isString().optional({checkFalsy:true}).withMessage('Invalid sampleLayoutFile'),
  ], async (req, res) => {
    try {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }
      
      const {application_id, cluster, title, fileNamePattern, searchString, description,sampleLayoutFile, fileLayoutData, selectedAsset} = req.body;
      if(!selectedAsset.isNew){
        // file template exists -> edit it
        const fileTemplate = await FileTemplate.update(
          {title, cluster_id : cluster, fileNamePattern, searchString, sampleLayoutFile, description},
          {where: {id : selectedAsset.id }}
        )
        await FileTemplateLayout.update(
          {fields : {layout : fileLayoutData}},
          {where : {fileTemplate_id : selectedAsset.id}}
        )
      }else{
        //New file template -> Create it
      const fileTemplate = await FileTemplate.create({application_id, title, cluster_id : cluster, fileNamePattern, searchString, sampleLayoutFile, description });
      await FileTemplateLayout.create({application_id, fileTemplate_id : fileTemplate.id, fields : {layout : fileLayoutData}})
      res.status(200).json({success : true, message : `Successfully created file template -> ${title}`});
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Error occurred while saving file details" });
    }
});

router.post('/getFileTemplate',  [
    body('id')
    .optional({checkFalsy:true}).isUUID(4).withMessage('Invalid id'),
    body('application_id')
      .isUUID(4).withMessage('Invalid application id'),
  ], 
  async (req, res) =>{
  try{
    const result = await FileTemplate.findOne({where : {id : req.body.id}, include :FileTemplateLayout });
    res.status(200).json(result)
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
 async(req, res) =>{ // Add validation rules
  const {id, application_id} = req.body;
  try{
    await FileTemplate.destroy({where : {id, application_id}});
    res.status(200).json({success : true, message : 'File template deleted successfully'})
  }catch(err){
    console.log(err);
    res.status(500).json({success : false, message : 'Unable to delete File Template'})
  }
});

module.exports = router;
