const express = require('express');
const router = express.Router();
let mongoose = require('mongoose');
var models  = require('../../models');
let Workflow = models.workflows;
let WorkflowDetails = models.workflowdetails;
let Dataflow = models.dataflow;
let Job = models.job;
var eventsInstance = require('events');
var fileInstanceEventEmitter = new eventsInstance.EventEmitter();
var kafka = require('kafka-node'),
    Producer = kafka.Producer,
    Consumer = kafka.Consumer,
    client = new kafka.KafkaClient({kafkaHost: process.env.KAFKA_ADVERTISED_LISTENER + ':' + process.env.KAFKA_PORT}),
    /*consumer = new Consumer(client, [{ topic: "Dataflow", partition: 0 }], {
        autoCommit: false
    });*/
    ConsumerGroup = kafka.ConsumerGroup;

let hpccJSComms = require("@hpcc-js/comms")    

var kafkaConsumerOptions = {
  kafkaHost: process.env.KAFKA_ADVERTISED_LISTENER + ':' + process.env.KAFKA_PORT, // connect directly to kafka broker (instantiates a KafkaClient)
  batch: undefined, // put client batch settings if you need them
  ssl: false, // optional (defaults to false) or tls options hash
  groupId: 'ExampleTestGroup',
  sessionTimeout: 15000,
  // An array of partition assignment protocols ordered by preference.
  // 'roundrobin' or 'range' string for built ins (see below to pass in custom assignment protocol)
  protocol: ['roundrobin'],
  encoding: 'utf8', // default is utf8, use 'buffer' for binary data

  // Offsets to use for new groups other options could be 'earliest' or 'none' (none will emit an error if no offsets were saved)
  // equivalent to Java client's auto.offset.reset
  fromOffset: 'latest', // default
  commitOffsetsOnFirstJoin: true, // on the very first time this consumer group subscribes to a topic, record the offset returned in fromOffset (latest/earliest)
  // how to recover from OutOfRangeOffset error (where save offset is past server retention) accepts same value as fromOffset
  outOfRangeOffset: 'earliest'
};    

router.get('/', (req, res) => {
    console.log("[graph] - Get workflows for app_id = " + req.query.application_id);
    let results = [];
    try {

        Workflow.findAll({
          where:{"application_Id":req.query.application_id},
          include:[{model: WorkflowDetails, attributes:['instance_id', 'createdAt', 'updatedAt']}],
          group:['workflowdetails.instance_id'],
          order:[[WorkflowDetails, 'createdAt', 'DESC']]
        }).then(function(workflows) {
          if(workflows && workflows[0] != undefined) {
            results = workflows[0].workflowdetails.map((workflowdetail) => {
              let obj = Object.assign({
                "id":workflows[0].id,              
                "name": workflows[0].name,
                "dataflowId": workflows[0].dataflowId,
                "instance_id":workflowdetail.instance_id,
                "createdAt": workflowdetail.createdAt,
                "updatedAt": workflowdetail.updatedAt
              })
              return obj;
            });
          }
          res.json(results);
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
        WorkflowDetails.findAll({
          where:{"application_Id":req.query.application_id, "workflow_id":req.query.workflow_id, "instance_id":req.query.instance_id}, 
          order: [['updatedAt', 'DESC']],
        }).then(function(workflowDetails) {
            res.json(workflowDetails);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

let workunitInfo = (wuid) => {
  let wsWorkunits = new hpccJSComms.WorkunitsService({ baseUrl: process.env.DATAFLOW_CLUSTER_URL, userID: "", password: "", type: "get" });
  return new Promise((resolve, reject) => {
    wsWorkunits.WUInfo({"Wuid":wuid, "IncludeExceptions":true, "IncludeSourceFiles":true, "IncludeResults":true}).then(async (wuInfo) => {
      console.log('state: '+wuInfo.Workunit.State);
      if(wuInfo.Workunit.State == 'completed' || wuInfo.Workunit.State == 'failed' || wuInfo.Workunit.State == 'wait') {
        resolve(wuInfo);
      } else {
        setTimeout(_ => {
          resolve(workunitInfo(wuid));
        }, 500);

      }
    })      
  });
}

let parseWUExceptions = (exceptions) => {
  if(exceptions.ECLException) {
    let message = exceptions.ECLException.map(({ Severity, Message }) => ({Severity, Message}));
    console.log('message: '+JSON.stringify(message))
    return JSON.stringify(message);
  } 
} 

let createWorkflowDetails = (message, workflowId, dataflowId) => {
  return new Promise((resolve, reject) => {
    workunitInfo(message.wuid).then((wuInfo) => {
      console.log(wuInfo)      
      Job.findOne({where:{application_id:message.applicationid, dataflowId:dataflowId, name:wuInfo.Workunit.Jobname}}).then((job) => {
        WorkflowDetails.create({
          "workflow_id": workflowId, 
          "application_id": message.applicationid,
          "instance_id": message.instanceid,
          "task": job.id,
          "status": wuInfo.Workunit.State,
          "message": wuInfo.Workunit.Exceptions ? parseWUExceptions(wuInfo.Workunit.Exceptions) : '',
          "wuid": message.wuid  
        }).then((result) => {
          console.log("workflow status stored...");
          resolve(result);
        }).catch((err) => {
          reject();
        })
      });
    })
  });          
}

var consumerGroup = new ConsumerGroup(kafkaConsumerOptions, 'Dataflow');
consumerGroup.on('message', (response) => {
  console.log(response.value);
  let dataflowWhereClause, message;
  try {
    message = JSON.parse(response.value);
    if(message.dataflowId) {
      dataflowWhereClause = '{"id":"'+message.dataflowId+'"}';
    } else {
      dataflowWhereClause = '{"applicaton_id":"'+message.applicationid+'"}';
    }
  }catch(err) {
    console.log('invalid json: '+err)
    //return;
  }

  if(dataflowWhereClause) {
    console.log('dataflowWhereClause: '+dataflowWhereClause);
    console.log('{where:'+ dataflowWhereClause+'}');
    Dataflow.findOne({where: {'application_id':message.applicationid}}).then((dataflow) => {
      Workflow.findOrCreate({
        where:{application_id:message.applicationid, dataflowId:dataflow.id},      
        defaults:{
          "name": dataflow.title,
          "description": "",
          "application_id": message.applicationid,
          "status": "In-Progress",
          "dataflowId": dataflow.id
        }
      }).then((results) => {
        createWorkflowDetails(message, results[0].id, dataflow.id).then((result) => {
          console.log('workflow details added');
        })            
      }).catch((err) => {
        console.log(err);
      })
    })
  }
  
});

consumerGroup.on('error', (error) => {
  console.log('Consumer error occured: '+error);
});  

module.exports = router;