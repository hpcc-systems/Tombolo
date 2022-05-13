const express = require('express');
const router = express.Router();
const assert = require('assert');
var models  = require('../../models');
let Consumer = models.consumer;
let ConsumerObject = models.consumer_object;
const { body, validationResult} = require('express-validator');
const validatorUtil = require('../../utils/validator');

router.get('/consumers', (req, res) => {
    Consumer.findAll({order: [['createdAt', 'DESC']]}).then(function(consumers) {
        res.json(consumers);
    })
    .catch(function(err) {
        console.log(err);
    });
});

router.post('/consumer',[
    body('contact_email').isEmail().withMessage('Invalid E-mail')
], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    var consumerId, fieldsToUpdate;
    try {
        Consumer.findOrCreate(
            {where: {name:req.body.name},
            defaults: req.body
        }).then(function(result) {
            consumerId = result[0].id;
            fieldsToUpdate = {"name":req.body.name, "type":req.body.type, "contact_name":req.body.contact_name, "contact_email":req.body.contact_email, "ad_group":req.body.ad_group, "assetType":req.body.assetType, "transferType":req.body.transferType};
            if(!result[1]) {
                return Consumer.update(req.body, {where:{name:req.body.name}}).then(function(result){})
            }
        }), function(err) {
            return res.status(500).send("Error occured while saving Consumer information");
        }
        res.json({"result":"success"});
    } catch (err) {
        console.log('err', err);
    }

});

router.get('/consumer', (req, res) => {
    console.log("[consumer details/read.js] - Get index details for app_id = " + req.query.consumer_id );
    var basic = {}, results={};
    try {
        Consumer.findOne({where:{"id":req.query.consumer_id}}).then(function(consumer) {
            results.consumer = consumer;
            res.json(results);
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
        Consumer.destroy(
            {where:{id: req.body.consumerToDelete}}
        ).then(function(deleted) {
            res.json({"result":"success"});
        });
    } catch (err) {
        console.log('err', err);
    }
});

module.exports = router;