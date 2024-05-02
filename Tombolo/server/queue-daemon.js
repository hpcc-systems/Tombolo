const { Kafka, CompressionTypes, CompressionCodecs } = require('kafkajs');
const SnappyCodec = require('kafkajs-snappy')
const { fs } = require('fs');
const models = require('./models');
const hpccUtil = require('./utils/hpcc-util');
let JobExecution = models.job_execution;
let Job = models.job;
let Cluster = models.cluster;
const JobScheduler = require('./jobSchedular/job-scheduler');
require('dotenv').config();
const NotificationModule = require('./routes/notifications/email-notification');

CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;
const JOB_COMPLETE_TOPIC = process.env.JOB_COMPLETE_TOPIC;
const JOB_COMPLETE_GROUP_ID = process.env.JOB_COMPLETE_GROUP_ID;

const START_JOB_TOPIC = process.env.START_JOB_TOPIC;

class QueueDaemon {
  constructor() {
    if(process.env.KAFKA_HOST_NAME) {
      this.kafka = new Kafka({
        clientId: 'tombolo',
        brokers: [`${process.env.KAFKA_HOST_NAME}:${process.env.KAFKA_PORT}`]
      });
      this.consumer = this.kafka.consumer({ groupId: JOB_COMPLETE_GROUP_ID });
      //this.producer = this.kafka.producer();

      (async () => {
        await this.bootstrap();
      })();
    }
  }

  async bootstrap() {
    try {
      if(this.consumer) {
        await this.consumer.connect();

        //await this.consumer.subscribe({ topic: JOB_COMPLETE_TOPIC, fromBeginning: true });

        await this.consumer.subscribe({ topic: START_JOB_TOPIC, fromBeginning: true });

        await this.consumer.run({
          eachMessage: async ({ topic, partition, message }) => {
            console.log('topic: '+topic);
            switch (topic) {
              case JOB_COMPLETE_TOPIC:
                this.processJob(message.value.toString());
                break;
              case START_JOB_TOPIC:
                this.startJob(message.value.toString());
                break;
            }
          },
        });

        //await this.producer.connect();
      }
    }catch (err) {      
      console.log(err);
    }
  }

  async shutdown() {
    console.log('disconnect consumer');
    await this.consumer.disconnect();
    /*console.log('disconnect producer');
    await this.producer.disconnect();*/
    console.log('kafka shutdown');
  }

  async submitMessage(topic = '', message = '') {
    /*await this.producer.send({
      topic: topic,
      messages: [
        { value: message },
      ],
    });*/
  }

  async processJob(message) {
    try {
      let msgJson = JSON.parse(message);
      console.log(msgJson);
      if(msgJson.wuid) {
        let jobExecution = await JobExecution.findOne({where: {wuid: msgJson.wuid}});
        if(jobExecution) {
          let cluster = await hpccUtil.getCluster(jobExecution.clusterId)
          let wuInfo = await hpccUtil.workunitInfo(msgJson.wuid, jobExecution.clusterId);
          if(wuInfo.Workunit.State == 'completed' || wuInfo.Workunit.State == 'wait' || wuInfo.Workunit.State == 'blocked') {
            await JobScheduler.scheduleCheckForJobsWithSingleDependency({ dependsOnJobId: jobExecution.jobId, dataflowId:jobExecution.dataflowId });
          } else if(wuInfo.Workunit.State == 'failed') {
            Job.findOne({where: {name: wuInfo.Workunit.Jobname}, attributes: {exclude: ['assetId']}}).then(async (job) => {
              if(job.contact) {
                let cluster = await Cluster.findOne({where: {id: job.cluster_id}});
                NotificationModule.notify({
                  from: process.env.EMAIL_SENDER,
                  to: job.contact,
                  subject: job.name + ' Failed',
                  html: '<p>Job "'+job.name+'" failed on "'+cluster.name+'" cluster</p>' +
                    '<p>Workunit Id: <a href="'+cluster.thor_host + ':' + cluster.thor_port + '/?Wuid='+msgJson.wuid+'&Widget=WUDetailsWidget">'+msgJson.wuid+'</a></p>'
                })
              }
            })
          }
          await JobExecution.update({
            status: wuInfo.Workunit.State,
            wu_duration: wuInfo.Workunit.TotalClusterTime
          },
          {where: {wuid: msgJson.wuid}})
        }
      }
    } catch(err) {
      console.error(err);
    }
  }

  async startJob(message) {
    console.log("startJob");
    try {
      let msgJson = JSON.parse(message);
      console.log(msgJson);
      JobScheduler.scheduleMessageBasedJobs(msgJson);
    } catch(err) {
      console.error(err);
    }
  }
}

module.exports = new QueueDaemon();