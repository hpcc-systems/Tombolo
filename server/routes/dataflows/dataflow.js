const express = require('express');
const router = express.Router();
let mongoose = require('mongoose');
var models  = require('../../models');
let Dataflow = models.dataflow;
let DataflowGraph = models.dataflowgraph;

router.post('/save', (req, res) => {
    var id=req.body.id, application_id=req.body.application_id;
    let whereClause = (id == '' ? {application_id:req.body.application_id, title: req.body.title} : {id:id});
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

router.get('/', (req, res) => {
    console.log("[dataflow] - Get dataflow list for app_id = " + req.query.application_id);
    try {
        Dataflow.findAll(
          {
            where:{"application_Id":req.query.application_id}, 
            include: [DataflowGraph],
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

router.post('/delete', (req, res) => {
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


module.exports = router;