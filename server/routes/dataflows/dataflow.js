const express = require('express');
const router = express.Router();
var models  = require('../../models');
let AssetDataflow = models.assets_dataflows;
let Dataflow = models.dataflow;
let DataflowGraph = models.dataflowgraph;
let Index = models.indexes;
let File = models.file;
let Query = models.query;
let Job = models.job;
let DependentJobs = models.dependent_jobs;
let JobExecution = models.job_execution;
const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator');
const { recordJobExecution } = require('../../utils/assets');

router.post('/save', [
  body('id')
    .optional({checkFalsy:true})
    .isUUID(4).withMessage('Invalid dataflow id'),
  body('application_id')
    .isUUID(4).withMessage('Invalid application id'),
  body('clusterId')
    .isUUID(4).withMessage('Invalid cluster id'),
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
          type: 'main',
          description: req.body.description,
          clusterId: req.body.clusterId
        }
      }).then(async function(result) {
          id = result[0].id;
          if(!result[1]) {
            Dataflow.update({
	            title: req.body.title,
	            description: req.body.description,
                  clusterId: req.body.clusterId
            }, {where:{id:id, application_id:application_id}}).then((dataflowUpdate) => {
              /*let promises=[];
              DataflowGraph.findAll({
                where: {application_id:application_id}
              }).then((dataflowGraphs) => {
                dataflowGraphs.forEach((dataflowGraph) => {
                  let updatedNodes = JSON.parse(dataflowGraph.nodes).map((node) => {
                    if(node.subProcessId == id) {
                      node.title = req.body.title;
                    }
                    return node;
                  })
                  promises.push(DataflowGraph.update({nodes:JSON.stringify(updatedNodes)}, {where:{application_id: application_id, id: dataflowGraph.id}}));
                })

                Promise.all(promises).then(() => {
                  res.json({"result":"success"});
                })
              })*/
              res.json({"result":"success"});
            })
         } else {
          res.json({"result":"success"});
         }
      }), function(err) {
          return res.status(500).send("Error occured while saving Dataflow");
      }
    } catch (err) {
        console.log('err', err);
    }
});

router.post('/saveAsset', (req, res) => {
  AssetDataflow.findOne({
    where: {
      assetId: req.body.assetId,
      dataflowId: req.body.dataflowId
    }
  }).then(async assetDataflow => {
    if (assetDataflow === null) {
      assetDataflow = await AssetDataflow.create({
        assetId: req.body.assetId,
        dataflowId: req.body.dataflowId
      });
      console.log(`assetDataflow created: ${JSON.stringify(assetDataflow.dataValues)}`);
      return res.json({ success: true, message: `asset ${assetDataflow.assetId} added to dataflow ${assetDataflow.dataflowId}` });
    }
    console.log(`assetDataflow found: ${JSON.stringify(assetDataflow.dataValues)}`);
    return res.json({ success: true, message: `asset ${assetDataflow.assetId} already associated to dataflow ${assetDataflow.dataflowId}` });
  });
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
    .isUUID(4).withMessage('Invalid application_id'),
  body('dataflowId')
    .isUUID(4).withMessage('Invalid dataflowId')
], async (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  //find all jobs in this dataflow and remove them from scheduler
  let dataflowGraph = await DataflowGraph.findOne({where: {dataflowId: req.body.dataflowId}});
  console.log(dataflowGraph);
  if(dataflowGraph){
  for(const node of dataflowGraph.nodes) {
    console.log(node);
    if(node.type == 'Job' && node.schedulerType == 'Time') {
      let job = await Job.findOne({where: {id: node.jobId}, attributes: ['name']});
      console.log("**************************removing "+job.name+" scheduler");
      await JobScheduler.removeJobFromScheduler(job.name + '-' + req.body.dataflowId + '-' + node.jobId);
    }
  }
}

  await JobExecution.destroy({where: {dataflowId: req.body.dataflowId}});

  await AssetDataflow.destroy({where: {'dataflowId': req.body.dataflowId}});
  
  await DependentJobs.destroy({where: {'dataflowId': req.body.dataflowId}});

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

  Dataflow.findOne({
    where: {
      id: req.query.dataflowId
    },
    include: [{model: File, as: 'files'}, {model:Index, as: 'indexes'}, {model: Job, as: 'jobs', attributes: { exclude: ['assetId'] }}],
  }).then(data => {
    data.files.forEach(file => {
      results.push({
        'id': file.id,
        'title': file.title,
        'name': file.name,
        'description': file.description,
        'objType': 'file',
        'createdAt': file.createdAt,
        'contact': file.consumer
      });
    });
    data.indexes.forEach((index) => {
      results.push({
        'id': index.id,
        'title': index.title,
        'name': index.title,
        'description': index.description,
        'objType': 'index',
        'createdAt': index.createdAt,
        'contact':''
      });
    });
    data.jobs.forEach(job => {
      results.push({
        'id': job.id,
        'title': job.name,
        'name': job.name,
        'description': job.description,
        'objType': 'job',
        'createdAt': job.createdAt,
        'contact': job.contact
      });
    });
    res.json(results);
  });

  /*
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
            "objType": "file",
            "createdAt": file.createdAt,
            "contact": file.consumer
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
            "objType": "job",
            "createdAt": job.createdAt,
            "contact": job.contact
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
            "objType": "index",
            "createdAt": index.createdAt,
            "contact":""
        })
      })
      res.json(results);
    }).catch(function(err) {
        console.log(err);
    });
  */
});

module.exports = router;