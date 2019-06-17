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
        FileInstance.create({
            "file_definition": req.body.file_definition,
            "receive_date": req.body.receive_date,
            "media_type": req.body.media_type,
            "update_type": req.body.update_type,
            "expected_file_count": req.body.expected_file_count,
            "actual_file_count": req.body.actual_file_count,
            "customer_name": req.body.customer_name,
            "frequency": req.body.frequency,
            "next_expected_delivery": req.body.next_expected_delivery,
            "item_name": req.body.item_name,
            "source_name": req.body.source_name,
            "data_provider_id": req.body.data_provider_id,
            "member_id": req.body.member_id,
            "file_source_id": req.body.file_source_id,
            "data_profile_path": req.body.data_profile_path,
            "data_profile_wuid": req.body.data_profile_wuid,
            "cluster_id": req.body.cluster_id,
            "application_id": req.body.application_id
        }).then(function(instance) {
            var eventData = [];
            var fileDetails = getFileDetails(instance.application_id, instance.file_definition).then(function (fileDetails) {
                //console.log('fileDetails: '+JSON.stringify(fileDetails));
                var fileDetailsObj = {
                    "id":fileDetails[0].id,
                    "application_id":fileDetails[0].application_id,
                    "title":fileDetails[0].title,
                    "description":fileDetails[0].description,
                    "fileType":fileDetails[0].fileType,
                    "isSuperFile":fileDetails[0].isSuperFile,
                    "primaryService":fileDetails[0].primaryService,
                    "backupService":fileDetails[0].backupService,
                    "qualifiedPath":fileDetails[0].qualifiedPath,
                    "layout": fileDetails[0].file_layouts,
                    "validation": fileDetails[0].file_validations
                };
                eventData.push({"fileDetails":fileDetailsObj});
                //fileInstanceEventEmitter.emit('file_received', eventData);

                /*var km = new KeyedMessage('file_received', eventData);
                var payloads = [
                    { topic: process.env.KAFKA_TOPIC_NAME, messages: JSON.stringify(eventData) }
                ];
                console.log("going to send to kafka: "+producer);
                //producer.on('ready', function () {
                    //console.log("producer ready");
                    producer.send(payloads, function (err, data) {
                        console.log('kafka response: '+data);
                    });
                //});*/
                res.json({"result":"success"});
            });
        });
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

router.get('/instance_details', (req, res) => {
    console.log("[instance_details] - Get instance details for instance_id = " + req.query.id);
    try {
        FileInstance.findOne({where:{"id":req.query.id}}).then(function(fileInstance) {
            console.log("fileInstance: "+fileInstance.length);
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