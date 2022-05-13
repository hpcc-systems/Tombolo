const express = require('express');
const router = express.Router();
const assert = require('assert');
var models  = require('../../models');
let Sequelize = require('sequelize');
const Op = Sequelize.Op;
let ControlsAndRegulations = models.controls_regulations;
let DataTypes=models.data_types;

router.get('/controlsAndRegulations', (req, res) => {
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

router.get('/getComplianceByDataType', (req, res) => {
    let dataTypes = req.query.dataType.split(',')
    ControlsAndRegulations.findAll({
        attributes: ['compliance'],
        group: ['compliance'],
        where:{"data_types": {[Op.in]:dataTypes}}
      }).then(function(regulations) {
        var compliance=[];
        if(regulations.length>0)
        {
            for(var obj in regulations)
            {
                console.log(regulations[obj].compliance);
                compliance.push(regulations[obj].compliance);
            }
        }
        res.json(compliance);
    })
    .catch(function(err) {
        console.log(err);
    });
});
module.exports = router;