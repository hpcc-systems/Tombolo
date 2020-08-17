const express = require('express');
const router = express.Router();
let mongoose = require('mongoose');
var models  = require('../../models');
let DataDictionary = models.datadictionary;
const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator/check');

router.post('/save', [
  body('id')
    .optional({checkFalsy:true})
    .isUUID(4).withMessage('Invalid id'),
  body('application_id')
    .isUUID(4).withMessage('Invalid application id')
], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    console.log('data dictionary save');
    var id=req.body.id, applicationId=req.body.application_id;
    let whereClause = (!id || id == '' ? {applicationId:req.body.application_id, name: req.body.name} : {id:id});
    try {
        DataDictionary.findOrCreate({
          where: whereClause,
          defaults: {
            applicationId: req.body.application_id,
            name: req.body.name,
            description: req.body.description,
            data_defn: req.body.data_defn
          }
        }).then(async function(result) {
            id = result[0].id;
            if(!result[1]) {
              return DataDictionary.update({              
  	            name: req.body.name,
  	            description: req.body.description,
                data_defn: req.body.data_defn
              }, {where:{id:id, applicationId:applicationId}})
          }
        }).then(function(graph) {
            res.json({"result":"success"});
        }), function(err) {
            return res.status(500).send(err);
        }
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/', [  
  query('application_id')
    .isUUID(4).withMessage('Invalid application id')
],(req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[datadictionary] - Get datadictionary list for app_id = " + req.query.application_id);
  let whereClause = {applicationId:req.query.application_id};
  if(req.query.id && req.query.id != undefined) {
    whereClause.id = req.query.id
  }

  try {
    DataDictionary.findAll({
      where: whereClause, 
      //include: [DataflowGraph],
      order: [
        ['createdAt', 'DESC']
      ],
    }).then(function(dataDictionary) {      
      res.json(dataDictionary);
    }).catch(function(err) {
      console.log(err);
    });
  } catch (err) {
    console.log('err', err);
  }
});

router.post('/delete', [  
  body('application_id')
    .isUUID(4).withMessage('Invalid application_id'),
  body('id')
    .isUUID(4).withMessage('Invalid id')
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  DataDictionary.destroy(
      {where:{"id": req.body.id, "applicationId":req.body.application_id}}
  ).then(function(deleted) {
    res.json({"result":"success"});
  }).catch(function(err) {
      console.log(err);
  });
});

module.exports = router;