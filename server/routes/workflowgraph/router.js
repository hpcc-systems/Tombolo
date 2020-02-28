const express = require('express');
const router = express.Router();
let mongoose = require('mongoose');
var models  = require('../../models');
let WorkflowGraph = models.workflowgraph;

router.post('/save', (req, res) => {
    var graphId='', application_id=req.body.application_id;
    try {
        WorkflowGraph.findOrCreate({
            where: {application_id:req.body.application_id},
            defaults: {
                application_id: req.body.application_id,
                nodes: JSON.stringify(req.body.nodes),
                edges: JSON.stringify(req.body.edges)
            }
        }).then(async function(result) {
            graphId = result[0].id;
            if(!result[1]) {
                return WorkflowGraph.update({
                    application_id: req.body.application_id,
                    nodes: JSON.stringify(req.body.nodes),
                    edges: JSON.stringify(req.body.edges)
                }, {where:{application_id:application_id}})
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
        WorkflowGraph.findOne({where:{"application_Id":req.query.application_id}}).then(function(graph) {
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
    WorkflowGraph.destroy(
        {where:{"id": req.body.jobId, "application_id":req.body.application_id}}
    ).then(function(deleted) {
        res.json({"result":"success"});
    }).catch(function(err) {
        console.log(err);
    });
});

module.exports = router;