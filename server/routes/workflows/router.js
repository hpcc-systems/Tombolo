const express = require('express');
const router = express.Router();
let mongoose = require('mongoose');
var models  = require('../../models');
let Workflow = models.workflows;
let WorkflowDetails = models.workflowdetails;
let Dataflow = models.dataflow;
let Job = models.job;
let Sequelize = require('sequelize');
const validatorUtil = require('../../utils/validator');
const hpccUtil = require('../../utils/hpcc-util');
const { body, query, validationResult } = require('express-validator/check');
var eventsInstance = require('events');
var moment = require('moment');
var fileInstanceEventEmitter = new eventsInstance.EventEmitter();
var kafka = require('kafka-node'),
    //Producer = kafka.Producer,
    //Consumer = kafka.Consumer,
    //client = new kafka.KafkaClient({kafkaHost: process.env.KAFKA_ADVERTISED_LISTENER + ':' + process.env.KAFKA_PORT}),
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

router.get('/', [    
  query('application_id')
    .isUUID(4).withMessage('Invalid application id'),
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[graph] - Get workflows for app_id = " + req.query.application_id);
  let results = [];
  try {
      Workflow.findAll({
        where:{"application_Id":req.query.application_id},
        include:[{model: WorkflowDetails, 
          attributes:['instance_id', 'createdAt', 'updatedAt', 
            [Sequelize.fn('min', Sequelize.col('workflowdetails.createdAt')), 'start'], 
            [Sequelize.fn('max', Sequelize.col('workflowdetails.createdAt')), 'end'],
            [models.sequelize.literal('CASE WHEN workflowdetails.status = "failed" THEN 1 ELSE 0 END'), 'failed_tasks']
        ]}],
        group:['workflowdetails.instance_id'],
        order:[[WorkflowDetails, 'createdAt', 'DESC']],
        raw: true
      }).then(function(workflows) {
        try {
          if(workflows) {          
            results = workflows.map((workflow) => {
              let startDate = moment(workflow["workflowdetails.start"]);
              let endDate = moment(workflow["workflowdetails.end"]);
              let durationSecs = endDate.diff(startDate, 'seconds');
              let obj = Object.assign({
                "id":workflow.id,              
                "name": workflow.name,
                "dataflowId": workflow.dataflowId,
                "instance_id":workflow["workflowdetails.instance_id"],
                "createdAt": workflow["workflowdetails.createdAt"],
                "updatedAt": workflow["workflowdetails.updatedAt"],
                "status": workflow["workflowdetails.failed_tasks"] == 0 ? "Completed" : "Completed with errors",
                "start": workflow["workflowdetails.start"],
                "end": workflow["workflowdetails.end"],
                "duration": durationSecs
              })
              //console.log(workflowdetail.createdAt)
              return obj;
            });
          }
        } catch(err) {
          console.log(err)
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

router.get('/details', [    
  query('application_id')
    .isUUID(4).withMessage('Invalid application id'),
  query('workflow_id')
    .isUUID(4).withMessage('Invalid workflow id'),
  query('instance_id')
    .isInt().withMessage('Invalid instance id'),    
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[graph] - Get workflow details for app_id = " + req.query.application_id + " workflow_id: "+req.query.workflow_id);
  try {
    Workflow.findOne({where:{id:req.query.workflow_id}}).then((workflow) => {
      Dataflow.findOne({where:{id:workflow.dataflowId}}).then((dataFlow) => {
        hpccUtil.getCluster(dataFlow.clusterId).then((cluster) => {
          WorkflowDetails.findAll({
            where:{"application_Id":req.query.application_id, "workflow_id":req.query.workflow_id, "instance_id":req.query.instance_id}, 
            order: [['updatedAt', 'DESC']],
            raw: true
          }).then(function(workflowDetails) {
            let results = {};
            results.cluster = cluster.thor_host + ':' + cluster.thor_port;
            results.workflowDetails = workflowDetails;
            res.json(results);
          })
        })
      })
    }).catch(function(err) {
      console.log(err);
    });

  } catch (err) {
      console.log('err', err);
  }
});

let workunitInfo = (wuid, cluster) => {
  let clusterAuth = hpccUtil.getClusterAuth(cluster);
  let wsWorkunits = new hpccJSComms.WorkunitsService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : ""), type: "get" });
  return new Promise((resolve, reject) => {
    wsWorkunits.WUInfo({"Wuid":wuid, "IncludeExceptions":true, "IncludeSourceFiles":true, "IncludeResults":true}).then(async (wuInfo) => {
      console.log('state: '+wuInfo.Workunit.State);
      if(wuInfo.Workunit.State == 'completed' || wuInfo.Workunit.State == 'failed' || wuInfo.Workunit.State == 'wait' || wuInfo.Workunit.State == 'compiled') {
        resolve(wuInfo);
      } else {
        setTimeout(_ => {
          resolve(workunitInfo(wuid, cluster));
        }, 500);

      }
    })      
  });
}

let parseWUExceptions = (exceptions) => {
  if(exceptions.ECLException) {
    let errorsWarnings = exceptions.ECLException.filter(exception => (exception.Severity == 'Warning' || exception.Severity == 'Error'));
    let message = errorsWarnings.map(({ Severity, Message }) => ({Severity, Message}));
    console.log('message: '+message.length)
    if(message.length > 50) {
     message = message.splice(0, 50);
    }
    console.log('length after splicing: '+message.length)
    return JSON.stringify(message);
  }
}

let createWorkflowDetails = (message, workflowId, dataflowId, clusterId) => {
  return new Promise((resolve, reject) => {
    hpccUtil.getCluster(clusterId).then((cluster) => {
      workunitInfo(message.wuid, cluster).then((wuInfo) => {
        Job.findOne({where:{application_id:message.applicationid, dataflowId:dataflowId, name:wuInfo.Workunit.Jobname}}).then((job) => {
          let messageStr = wuInfo.Workunit.Exceptions ? parseWUExceptions(wuInfo.Workunit.Exceptions) : '';
          let start = moment(message.wuid.substr(message.wuid.indexOf('-')+1, message.wuid.length), "HHmmss");
          let end = moment(moment(start).add(wuInfo.Workunit.TotalClusterTime, 's'));

          WorkflowDetails.create({
            "workflow_id": workflowId, 
            "application_id": message.applicationid,
            "instance_id": message.instanceid,
            "task": job.id,
            "status": wuInfo.Workunit.State,
            "message": messageStr,
            "wuid": message.wuid,
            "wu_start": moment(start).format('HH:mm:ss'),
            "wu_end": moment(end).format('HH:mm:ss'),
            "wu_duration": wuInfo.Workunit.TotalClusterTime
          }).then((result) => {
            console.log("workflow status stored...");
            resolve(result);
          }).catch((err) => {
            reject();
          })
        });
      })
    });
  });          
}

router.get('/workunits', [    
  query('application_id')
    .isUUID(4).withMessage('Invalid application id'),
  query('workflow_id')
    .isUUID(4).withMessage('Invalid workflow id'),
  query('instance_id')
    .isInt().withMessage('Invalid instance id'),    
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[workunits] - Get workunits for app_id = " + req.query.application_id + " workflow_id: "+req.query.workflow_id);
  try {
    let workunits = [], promises = [], results={};
    Dataflow.findOne({where: {'application_id':req.query.application_id}}).then((dataflow) => {
      hpccUtil.getCluster(dataflow.clusterId).then((cluster) => {
        results.cluster = cluster.thor_host + ':' + cluster.thor_port;
        WorkflowDetails.findAll({
          where:{"application_Id":req.query.application_id, "workflow_id":req.query.workflow_id, "instance_id":req.query.instance_id}, 
          order: [['updatedAt', 'DESC']],
        }).then(function(workflowDetails) {
          workflowDetails.forEach((workflowDetail) => {
            promises.push(
              workunits.push({
                "wuid": workflowDetail.wuid,
                "status": workflowDetail.status,
                "start": workflowDetail.wu_start,
                "end": workflowDetail.wu_end,
                "totalClusterTime": workflowDetail.wu_duration
              })
            );
          })       
          Promise.all(promises).then(() => {
            results.workunits = workunits;
            res.json(results);     
          });                                                  
      });
      
    })        
    .catch(function(err) {
        console.log(err);
    });

  })
  } catch (err) {
      console.log('err', err);
  }
});

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
        createWorkflowDetails(message, results[0].id, dataflow.id, dataflow.clusterId).then((result) => {
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
  //Producer.close();
  //Consumer.close();
});  

module.exports = router;