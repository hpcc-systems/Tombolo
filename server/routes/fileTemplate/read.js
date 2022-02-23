const express = require('express');
const router = express.Router();
const { body,  validationResult } = require('express-validator');

const models = require('../../models');
const FileTemplate = models.fileTemplate;


router.post('/saveFileTemplate', [  // Add more validation rules
    body('id')
    .optional({checkFalsy:true})
      .isUUID(4).withMessage('Invalid id'),
    body('application_id')
      .isUUID(4).withMessage('Invalid application id'),
  ], async (req, res) => {
    try {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }
      
      const {fileTemplateId, application_id, cluster, title, fileNamePattern, searchString, description} = req.body;
      if(fileTemplateId){
        // file template exists -> edit it
      }else{
        //New file template -> Create it
        await FileTemplate.create({application_id, title, cluster_id : cluster, fileNamePattern, searchString, description });
        res.status(200).json({success : true, message : `Successfully created file template -> ${title}`})
        console.log(`<<<< req.body <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
        console.log(req.body)
        console.log('<<<< req.body <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Error occurred while saving file details" });
    }
});

router.post('/getFileTemplate', async (req, res) =>{ // Add validation 
  try{
    const result = await FileTemplate.findOne({where : {id : req.body.id}});
    console.log(`<<<< RESULT  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
    console.log(result)
    console.log('<<<< RESULT  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
    res.status(200).json(result)
  }catch (err){
    console.log(err);
    res.status(500).json({ success : false, message : 'Error occurred while trying to fetch file template details'})
  }
})

module.exports = router;
