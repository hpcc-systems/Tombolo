const express = require('express');
const router = express.Router();
const assert = require('assert');
var models  = require('../../models');
let Sequelize = require('sequelize');
let ControlsAndRegulations = models.controls_regulations;
let DataTypes=models.data_types;

router.get('/controlsAndRegulations', (req, res) => {
    console.log("[controlsAndRegulations/read.js] - Get Controls and Regulations list");
    ControlsAndRegulations.findAll({
        attributes: [
          'compliance',
          [Sequelize.fn('GROUP_CONCAT', Sequelize.col('data_types')), 'data_types']
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
    var compliance=req.body.compliance;
    if(req.body.oldCompName!="" && req.body.oldCompName!=req.body.compliance)
    {compliance=req.body.oldCompName}
    try {
        ControlsAndRegulations.destroy(
            {where:{compliance: compliance}}
        ).then(function(deleted) {
            ControlsAndRegulations.bulkCreate(regulations).then(function(regulation) {
                res.json({"result":"success"});
            });
        });       
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/dataTypes', (req, res) => {
    try {
        
        DataTypes.findAll().then(function(data_types) {            
            res.json(data_types);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});
module.exports = router;