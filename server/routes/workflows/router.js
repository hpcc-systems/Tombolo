const express = require('express');
const router = express.Router();
let mongoose = require('mongoose');
var models  = require('../../models');
let Workflow = models.workflows;
let WorkflowDetails = models.workflowdetails;

router.get('/', (req, res) => {
    console.log("[graph] - Get workflows for app_id = " + req.query.application_id);
    try {
        Workflow.findAll({where:{"application_Id":req.query.application_id}}).then(function(workflows) {
            res.json(workflows);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/details', (req, res) => {
    console.log("[graph] - Get workflow details for app_id = " + req.query.application_id + " workflow_id: "+req.query.workflow_id);
    try {
        WorkflowDetails.findAll({where:{"application_Id":req.query.application_id, "workflow_id":req.query.workflow_id}}).then(function(workflowDetails) {
            res.json(workflowDetails);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});
module.exports = router;