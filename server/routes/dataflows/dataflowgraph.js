const express = require('express');
const router = express.Router();
var models  = require('../../models');
let AssetDataflow = models.assets_dataflows;
let DataflowGraph = models.dataflowgraph;
let Dataflow = models.dataflow;
let Job = models.job;
let File = models.file;
let Index = models.indexes;
const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator');
const JobScheduler = require('../../job-scheduler');



router.get( '/',
  [
    query('application_id').optional({ checkFalsy: true }).isUUID(4).withMessage('Invalid application id'),
    query('dataflowId').isUUID(4).withMessage('Invalid dataflow id'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const { application_id, dataflowId  } = req.query;
      
      const dataflowgraph = await DataflowGraph.findOne({
         where: { application_id, dataflowId },
         attributes:['graph'],
      });

      res.json(dataflowgraph);
    } catch (error) {
      console.log('-error-----------------------------------------');
      console.dir({error}, { depth: null });
      console.log('------------------------------------------');
      
      res.status(500).json({ message: 'Unable to fetch the graph' });
    }
  }
);

router.post( '/save',
  [
    /*body('dataflowId') .optional({checkFalsy:true}) .isUUID(4).withMessage('Invalid dataflow id'),*/
    body('application_id').isUUID(4).withMessage('Invalid application id'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const { application_id, dataflowId, graph } = req.body;

      const dataflowGraphFields = { graph }

      let [dataflowGraph, isDataflowGraphCreated] = await DataflowGraph.findOrCreate({
        where: { application_id, dataflowId },
        defaults: dataflowGraphFields,
      });

      if (!isDataflowGraphCreated) dataflowGraph = await dataflowGraph.update(dataflowGraphFields);

      res.json({ result: 'success', dataflowId });
    } catch (error) {
      console.log('-error /dataflowgraph/save-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
      return res.status(500).send({ message: 'Error occurred while saving Dataflow Graph' });
    }
  }
);

router.post('/deleteAsset',
  [
    body('dataflowId').isUUID(4).withMessage('Invalid dataflow id'),
    body('assetId').isUUID(4).withMessage('Invalid asset id'),
    body('name').not().isEmpty().trim().escape(),
    body('type').custom(value =>{
      const types = ['job', 'file', 'index','sub-process']
      if (!types.includes(value)){
        throw new Error('Invalid asset type');
      }
       // Indicates the success of this synchronous custom validator
      return true;
    })
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    try {
      const deleted = await AssetDataflow.destroy({
        where: { dataflowId: req.body.dataflowId, assetId: req.body.assetId },
      });
      console.log('-deleted-----------------------------------------');
      console.dir({ deleted }, { depth: null });
      console.log('------------------------------------------');

      if (req.body.type === 'job') {
        await JobScheduler.removeJobFromScheduler(
          req.body.name + '-' + req.body.dataflowId + '-' + req.body.assetId
        );
      }
      res.json({ result: 'success' });
    } catch (error) {
      console.log('-/deleteAsset error-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
      res.status(422).json({ success: false, error: "Failed to delete asset" });
    }
  }
);


// !! NOT IN USE
router.post('/changeNodeVisibility', [
  body('id').optional({checkFalsy:true})
    .isUUID(4).withMessage('Invalid asset id'),
  body('dataflowId')
    .isUUID(4).withMessage('Invalid dataflow id'),
  body('application_id')
    .isUUID(4).withMessage('Invalid application id'),
  body('hide')
    .isBoolean().withMessage('Invalid visibility value'),

],(req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    let assetId=req.body.id, edgeId='';
    console.log('assetId: '+assetId+' dataflowId: '+req.body.dataflowId);
    DataflowGraph.findOne({where:{"application_Id":req.body.application_id, dataflowId:req.body.dataflowId}}).then(function(graph) {
      let nodes = graph.nodes, edges = graph.edges, DataflowGraphId=graph.id;
      nodes.forEach((node, idx) => {
        if(!assetId) {
          node.isHidden = false;
        } else if (node.id == assetId || (node.fileId == assetId || node.indexId == assetId || node.queryId == assetId || node.jobId == assetId || node.subProcessId == assetId)) {
          edgeId=node.id;
          if(req.body.hide) {
            node.isHidden = true
          } else {
            node.isHidden = false
          }
        }
      });
      edges = edges.filter(edge => (edge.source != edgeId && edge.target != edgeId));
      DataflowGraph.update(
        {nodes:JSON.stringify(nodes), edges:JSON.stringify(edges)},
        {where:{"id": DataflowGraphId, "application_id":req.body.application_id}}
      ).then(async function(updated) {
        res.json({"result":"success"});
      }).catch(function(err) {
          console.log(err);
      });
    })

});

// !! NOT IN USE
router.get('/nodedetails', [
  query('application_id')
    .optional({checkFalsy:true})
    .isUUID(4).withMessage('Invalid application id'),
  query('dataflowId')
    .isUUID(4).withMessage('Invalid dataflow id'),
  query('nodeId')
    .isInt().withMessage('Invalid node id'),
], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    console.log("[graph] - Get graph list for app_id = " + req.query.application_id);
    try {
        DataflowGraph.findOne({where:{"application_Id":req.query.application_id, "dataflowId":req.query.dataflowId}}).then(function(graph) {
          console.log(graph)
          res.json(graph);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

//!! NOT IN USE
router.post('/delete', [
  body('jobId')
    .isUUID(4).withMessage('Invalid job id'),
  body('application_id')
    .isUUID(4).withMessage('Invalid application id'),
], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    DataflowGraph.destroy(
        {where:{"id": req.body.jobId, "application_id":req.body.application_id}}
    ).then(function(deleted) {
        res.json({"result":"success"});
    }).catch(function(err) {
        console.log(err);
    });
});

// !! NOT IN USE
let createDataflow = (applicationId, dataflowType, parentDataflow) => {
  console.log(applicationId +', '+dataflowType +', '+parentDataflow)
  return new Promise((resolve, reject) => {
    Dataflow.findOne({
      where:{"application_id":applicationId, "id":parentDataflow.id}
    }).then((parentDataflow) => {
      console.log(parentDataflow.clusterId);
      console.log(applicationId +', '+dataflowType +', '+parentDataflow)
      Dataflow.create({
        application_id: applicationId,
        title: 'Default',
        type: dataflowType,
        clusterId: parentDataflow.clusterId
      }).then((dataflowCreated) => {
        resolve(dataflowCreated)
      })
    }).catch(function(err) {
        console.log(err);
    });
  });
}

//!! NOT IN USE
let updateNodeNameAndTitle = async (nodes) => {
  let nodesWithName = [];
  return new Promise(async (resolve, reject) => {
    try {
      for(const node of nodes) {
        switch (node.type) {
          case 'File' && node.fileId: 
            let file = await File.findOne({where: {id: node.fileId}});
            if(file) {              
              node.name = file.name;
              node.title = file.title;
            }
            break;
          case 'Job' && node.jobId: 
            let job = await Job.findOne({where: {id: node.jobId}});
            if(job) {
              node.name = job.name;
              node.title = job.title;              
            }
            break;
          case 'Index' && node.indexId: 
            let index = await Index.findOne({where: {id: node.indexId}});
            if(index) {
              node.name = index.name;
              node.title = index.title;
            }
            break;
        }

        nodesWithName.push(node);
      }
      resolve(nodesWithName)
    }catch(err) {
      console.log(err);
      reject(err);
    }
  })
}


module.exports = router;