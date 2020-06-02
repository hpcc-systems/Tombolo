const express = require('express');
const router = express.Router();
let mongoose = require('mongoose');
var models  = require('../../models');
let Dataflow = models.dataflow;
let DataflowGraph = models.dataflowgraph;
let Index = models.indexes;
let File = models.file;
let Query = models.query;
let Job = models.job;
const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator/check');

router.post('/save', [
  body('id')
    .optional({checkFalsy:true})
    .isUUID(4).withMessage('Invalid dataflow id'),
  body('application_id')
    .isUUID(4).withMessage('Invalid application id'),
], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    console.log('dataflow save');
    var id=req.body.id, application_id=req.body.application_id;
    let whereClause = (!id || id == '' ? {application_id:req.body.application_id, title: req.body.title} : {id:id});
    try {
        Dataflow.findOrCreate({
          where: whereClause,
          defaults: {
            application_id: req.body.application_id,
            title: req.body.title,
            description: req.body.description
          }
        }).then(async function(result) {
            id = result[0].id;
            if(!result[1]) {
              return Dataflow.update({
		            title: req.body.title,
		            description: req.body.description
              }, {where:{id:id, application_id:application_id}})
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
    .isUUID(4).withMessage('Invalid cluster id')
],(req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
    console.log("[dataflow] - Get dataflow list for app_id = " + req.query.application_id);
    try {
        Dataflow.findAll(
          {
            where:{"application_Id":req.query.application_id}, 
            //include: [DataflowGraph],
            order: [
              ['createdAt', 'DESC']
            ],
          }).then(function(dataflow) {
            res.json(dataflow);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

router.post('/delete', [  
  body('applicationId')
    .isUUID(4).withMessage('Invalid application_id')
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
    Dataflow.destroy(
        {where:{"id": req.body.dataflowId, "application_id":req.body.applicationId}}
    ).then(function(deleted) {
      DataflowGraph.destroy(
        {where:{"dataflowId": req.body.dataflowId, "application_id":req.body.applicationId}}
      ).then(function(deleted) {
          res.json({"result":"success"});
      })       
    }).catch(function(err) {
        console.log(err);
    });
});

router.get('/assets', [  
  query('app_id')
    .isUUID(4).withMessage('Invalid application_id'),
  query('dataflowId')
    .isUUID(4).withMessage('Invalid dataflow id')
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
    console.log("[app/read.js] - App route called: "+req.query.app_id + " dataflowId: "+req.query.dataflowId);
    let results = [];
    File.findAll({
        raw: true,
        attributes:["id","title","name","description"],
        where:{"application_id":req.query.app_id, "dataflowId":req.query.dataflowId}
    })
    .then((files) => {
        files.forEach((file) => {
            results.push({
                "id":file.id,
                "title":file.title,
                "name":file.name,
                "description":file.description,
                "objType": "file"
            })
        });
        return Job.findAll({
            raw: true,
            attributes:["id","name","description"],
            where:{"application_Id":req.query.app_id, "dataflowId":req.query.dataflowId}
        });
    })
    .then((jobs) => {
        jobs.forEach((job) => {
            results.push({
                "id":job.id,
                "title":job.name,
                "name":job.name,
                "description":job.description,
                "objType": "job"
            })
        });
        return Index.findAll({
            raw: true,
            attributes:["id","title","description"],
            where:{"application_id":req.query.app_id, "dataflowId":req.query.dataflowId}}
        );
    })
    .then((indexes) => {
        indexes.forEach((index) => {
            results.push({
                "id":index.id,
                "title":index.title,
                "name":index.title,
                "description":index.description,
                "objType": "index"
            })
        })
        return Query.findAll({
            raw: true,
            attributes:["id","title","description"],
            where:{"application_id":req.query.app_id}
        })
    }).then((queries) => {
        queries.forEach((query) => {
            results.push({
                "id":query.id,
                "title":query.title,
                "name":query.title,
                "description":query.description,
                "objType": "query"
            })
        });
        res.json(results);
    }).catch(function(err) {
        console.log(err);
    });
});

module.exports = router;