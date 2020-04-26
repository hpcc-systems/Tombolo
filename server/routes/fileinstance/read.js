const express = require('express');
const router = express.Router();
var request = require('request');
var models  = require('../../models');
let FileInstance = models.file_instance;
let File = models.file;
let FileLayout = models.file_layout;
let FileValidation = models.file_validation;
var eventsInstance = require('events');
var fileInstanceEventEmitter = new eventsInstance.EventEmitter();
console.log('fileinstance - kafka list: '+process.env.KAFKA_ADVERTISED_LISTENER + ':' + process.env.KAFKA_PORT);
var kafka = require('kafka-node'),
    Producer = kafka.Producer;
    //HighLevelProducer = kafka.HighLevelProducer,
    //client = new kafka.KafkaClient({kafkaHost: process.env.KAFKA_ADVERTISED_LISTENER+':'+process.env.KAFKA_PORT}),
    //producer = new Producer(client),
    //KeyedMessage = kafka.KeyedMessage;

router.post('/create', (req, res) => {
    console.log("[file_instance create] ");
    try {
      let id='', whereClause = (!req.body.id ? {item_name:req.body.item_name} : {id:req.body.id});
      console.log(whereClause);
      FileInstance.findOrCreate({
        where: whereClause,
        defaults: {
          file_definition: req.body.file_definition,
          item_name: req.body.item_name,
          title: req.body.title,
          application_id: req.body.application_id,
        }
      }).then(async function(result) {
          id = result[0].id;
          if(!result[1]) {
            return FileInstance.update({
              title: req.body.title,
              item_name: req.body.item_name,
              title: req.body.title
            }, {where:{id:id}})
          }
      }).then(function(instance) {
        res.json({"result":"success", "fileInstanceId":id, "title":req.body.title});
      }), function(err) {
          return res.status(500).send(err);
      }            
    } catch (err) {
        console.log('err', err);
        return res.status(500).send(err);
    }
});

router.get('/instances', (req, res) => {
    try {
      FileInstance.findAll({where:{"file_definition":req.query.file_def}}).then(function(fileInstances) {
          res.json(fileInstances);
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
      FileInstance.destroy({where:{"id":req.body.id}}).then(function(fileInstances) {
          res.json({"result":"success"});
      })
      .catch(function(err) {
          console.log(err);
      });
    } catch (err) {
        console.log('err', err);
    }

});

router.get('/instance_details', (req, res) => {
    console.log("[instance_details] - Get instance details for instance_id = " + req.query.id);
    try {
        FileInstance.findOne({where:{"id":req.query.id}}).then(function(fileInstance) {
            res.json(fileInstance);
        })
    } catch (err) {
        console.log('err', err);
    }
});

fileInstanceEventEmitter.on('file_received', (data) => {
    console.log('file_received event: ');

    console.log(__dirname);
    const eclFilePath = "C:/Users/Public/Documents/HPCC Systems/ECL/My Files/Test/bwr_data_profile.ecl";
    createEclXMLAndSubmitWU(eclFilePath);

});

function getFileDetails(appId, fileTitle) {
    try {
        return File.findAll({where:{"application_id":appId, "id":fileTitle}, include: [FileLayout, FileValidation]});
    }catch(err) {
        console.log('err', err);
    }
}





module.exports = router;