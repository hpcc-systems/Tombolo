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

router.post('/save', [
  /*body('dataflowId')
    .optional({checkFalsy:true})
    .isUUID(4).withMessage('Invalid dataflow id'),*/
  body('application_id')
    .isUUID(4).withMessage('Invalid application id'),
], async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    var graphId='', application_id=req.body.application_id, dataflowId=req.body.dataflowId, dataflowType=req.body.dataflowType, parentDataflow=req.body.selectedParentDataflow;
    console.log('/save - dataflowgraph: '+application_id)
    try {
      let nodes = req.body.nodes, edges = req.body.edges;
      if(dataflowId == undefined && dataflowType == 'sub-process') {
        let dataflowCreated = await createDataflow(application_id, dataflowType, parentDataflow);
        dataflowId = dataflowCreated.id;
      }

      DataflowGraph.findOrCreate({
        where: {application_id:application_id, dataflowId:dataflowId},
        defaults: {
          application_id: req.body.application_id,
          nodes: JSON.stringify(nodes),
          edges: JSON.stringify(edges),
          dataflowId: dataflowId
        }
      }).then(async function(result) {
        graphId = result[0].id;
        if(!result[1]) {
          return DataflowGraph.update({
            application_id: req.body.application_id,
            nodes: JSON.stringify(nodes),
            edges: JSON.stringify(edges),
            dataflowId: dataflowId
          }, {where:{application_id:application_id, dataflowId:dataflowId}})
        }
      }).then(function(graph) {
        res.json({"result":"success", "dataflowId":dataflowId});
      }), function(err) {
        return res.status(500).send("Error occured while saving Dataflow Graph");
      }
    } catch (err) {
      console.log('err', err);
    }
});


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
router.get('/', [
  query('application_id')
    .optional({checkFalsy:true})
    .isUUID(4).withMessage('Invalid application id'),
  query('dataflowId')
    .isUUID(4).withMessage('Invalid dataflow id'),
], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      let nodes = [];
      DataflowGraph.findOne({
        where:{"application_Id":req.query.application_id, "dataflowId":req.query.dataflowId},
        raw: true
      }).then(async function(graph) {
        if(graph){
          let nodesWithNames = await updateNodeNameAndTitle(JSON.parse(graph.nodes));        
          graph.nodes = JSON.stringify(nodesWithNames);
          return res.json(graph);
        }else{
          //If there is no graph
         //return res.status(200).json({message : "No Graph"})
         res.json(graph)
        }
      })
      .catch(function(err) {
          res.status(400).json({message: "Unable to fetch the graph", error: err})
      });
    } catch (err) {
        console.log('err', err);
    }
});


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

router.post('/deleteAsset', [
  body('dataflowId')
    .isUUID(4).withMessage('Invalid dataflow id'),
  body('application_id')
    .isUUID(4).withMessage('Invalid application id'),
],(req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    let assetId=req.body.id, edgeId='';
    DataflowGraph.findOne({where:{"application_Id":req.body.application_id, dataflowId:req.body.dataflowId}}).then(function(graph) {
      let nodes = JSON.parse(graph.nodes), edges = JSON.parse(graph.edges), DataflowGraphId=graph.id;
      nodes.forEach((node, idx) => {
        if (node.id == assetId || (node.fileId == assetId || node.indexId == assetId || node.queryId == assetId || node.jobId == assetId || node.subProcessId == assetId)) {
          edgeId=node.id;
          nodes.splice(idx, 1);
        }
      });
      edges = edges.filter(edge => (edge.source != edgeId && edge.target != edgeId));

      DataflowGraph.update(
        {nodes:JSON.stringify(nodes), edges:JSON.stringify(edges)},
        {where:{"id": DataflowGraphId, "application_id":req.body.application_id}}
      ).then(async function(updated) {
        if (body('id').isUUID(4)) {
          await AssetDataflow.destroy({ where: { dataflowId: req.body.dataflowId, assetId: assetId } }).catch(err => console.log(err));
          Job.findOne({where:{id: assetId}, attributes: {exclude: ['assetId']}}).then(async (job) => {
            if(job) {
             await JobScheduler.removeJobFromScheduler(job.name + '-' + req.body.dataflowId + '-' + assetId);
            }
            res.json({"result":"success"});
          })
        }
      }).catch(function(err) {
          console.log(err);
      });
    })
});

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
      let nodes = JSON.parse(graph.nodes), edges = JSON.parse(graph.edges), DataflowGraphId=graph.id;
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

module.exports = router;