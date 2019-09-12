const express = require('express');
const router = express.Router();
const assert = require('assert');
var models  = require('../../models');
let Consumer = models.consumer;
let ConsumerObject = models.consumer_object;

router.get('/consumers', (req, res) => {
    console.log("[consumer/read.js] - Get consumer list");
    Consumer.findAll().then(function(consumers) {
        res.json(consumers);
    })
    .catch(function(err) {
        console.log(err);
    });
});

router.post('/consumer', (req, res) => {
    console.log("[save consumer/read.js] ");
    var consumerId, fieldsToUpdate;
    try {
        Consumer.findOrCreate(
            {where: {name:req.body.name},
            defaults: req.body
        }).then(function(result) {
            consumerId = result[0].id;
            fieldsToUpdate = {"name":req.body.name, "type":req.body.type, "contact_name":req.body.contact_name, "contact_email":req.body.contact_email, "ad_group":req.body.ad_group};
            if(!result[1]) {
                return Consumer.update(req.body, {where:{name:req.body.name}}).then(function(result){})
            }
        }), function(err) {
            return res.status(500).send(err);
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
    console.log("[delete/read.js] - delete consumer");
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