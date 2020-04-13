const express = require('express');
const router = express.Router();
let mongoose = require('mongoose');
var models  = require('../../models');
let DataflowGraph = models.dataflowgraph;

router.post('/save', (req, res) => {
    var graphId='', application_id=req.body.application_id, dataflowId=req.body.dataflowId;
    console.log('/save - dataflowgraph: '+application_id)
    try {
        DataflowGraph.findOrCreate({
            where: {application_id:application_id, dataflowId:dataflowId},
            defaults: {
                application_id: req.body.application_id,
                nodes: JSON.stringify(req.body.nodes),
                edges: JSON.stringify(req.body.edges),
                dataflowId: dataflowId
            }
        }).then(async function(result) {
            graphId = result[0].id;
            if(!result[1]) {
                return DataflowGraph.update({
                    application_id: req.body.application_id,
                    nodes: JSON.stringify(req.body.nodes),
                    edges: JSON.stringify(req.body.edges),
                    dataflowId: dataflowId
                }, {where:{application_id:application_id, dataflowId:dataflowId}})
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

router.get('/', (req, res) => {
    console.log("[graph] - Get graph list for app_id = " + req.query.application_id);
    try {
        DataflowGraph.findOne({where:{"application_Id":req.query.application_id, "dataflowId":req.query.dataflowId}}).then(function(graph) {
            res.json(graph);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});


router.post('/delete', (req, res) => {
    DataflowGraph.destroy(
        {where:{"id": req.body.jobId, "application_id":req.body.application_id}}
    ).then(function(deleted) {
        res.json({"result":"success"});
    }).catch(function(err) {
        console.log(err);
    });
});

router.post('/deleteAsset', (req, res) => {
    let assetId=req.body.id, edgeId='';
    console.log('assetId: '+assetId+' dataflowId: '+req.body.dataflowId);
    DataflowGraph.findOne({where:{"application_Id":req.body.application_id, dataflowId:req.body.dataflowId}}).then(function(graph) {
        let nodes = JSON.parse(graph.nodes), edges = JSON.parse(graph.edges), DataflowGraphId=graph.id;
        nodes.forEach((node, idx) => {
            if (node.id == assetId || (node.fileId == assetId || node.indexId == assetId || node.queryId == assetId || node.jobId == assetId)) {
                edgeId=node.id;
                nodes.splice(idx, 1);
            }
        });
        edges = edges.filter(edge => (edge.source != edgeId && edge.target != edgeId));
        
        console.log(JSON.stringify(edges));
        DataflowGraph.update(
            {nodes:JSON.stringify(nodes), edges:JSON.stringify(edges)},
            {where:{"id": DataflowGraphId, "application_id":req.body.application_id}}
        ).then(function(updated) {
            res.json({"result":"success"});
        }).catch(function(err) {
            console.log(err);
        });
    })
});

module.exports = router;