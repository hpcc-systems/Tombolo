const express = require('express');
const router = express.Router();
const assert = require('assert');
var models  = require('../../models');
let Sequelize = require('sequelize');
let ControlsAndRegulations = models.controls_regulations;
let IdentityDetails=models.identity_details;

router.get('/controlsAndRegulations', (req, res) => {
    console.log("[controlsAndRegulations/read.js] - Get Controls and Regulations list");
    ControlsAndRegulations.findAll({
        attributes: [
          'compliance',
          [Sequelize.fn('GROUP_CONCAT', Sequelize.col('identity_details')), 'identity_details']
        ],
        group: ['compliance']
      }).then(function(regulations) {
        res.json(regulations);
    })
    .catch(function(err) {
        console.log(err);
    });
});

router.get('/getRegulation', (req, res) => {
    console.log("[getRegulation/read.js] - Get controls and regulation for compliance = " + req.query.compliance );
    var basic = {}, results={};
    try {
        ControlsAndRegulations.findAll({
            where:{"compliance":req.query.compliance}
          }).then(function(regulations) {
            res.json(regulations);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }

});


router.post('/delete', (req, res) => {
    console.log("[delete/read.js] - delete Controls and Regulations");
    try {
        ControlsAndRegulations.destroy(
            {where:{compliance: req.body.compliance}}
        ).then(function(deleted) {
            res.json({"result":"success"});
        });
    } catch (err) {
        console.log('err', err);
    }
});

router.post('/saveRegulations', function (req, res) {
    console.log("[controlsAndRegulations/read.js] - saveRegulations called");
    var regulations=req.body.regulations;
    try {
        ControlsAndRegulations.destroy(
            {where:{compliance: req.body.compliance}}
        ).then(function(deleted) {
            ControlsAndRegulations.bulkCreate(regulations).then(function(regulation) {
                res.json({"result":"success"});
            });
        });       
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/identityDetails', (req, res) => {
    try {
        
        IdentityDetails.findAll().then(function(identityDetails) {            
            res.json(identityDetails);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});
module.exports = router;