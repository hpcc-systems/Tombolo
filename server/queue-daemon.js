const { Kafka, CompressionTypes, CompressionCodecs } = require('kafkajs');
const SnappyCodec = require('kafkajs-snappy')
const { fs } = require('fs');
const models = require('./models');
const hpccUtil = require('./utils/hpcc-util');
let JobExecution = models.job_execution;
const JobScheduler = require('./job-scheduler');
require('dotenv').config();

CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;
const JOB_COMPLETE_TOPIC = process.env.JOB_COMPLETE_TOPIC;

class QueueDaemon {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'tombolo',
      brokers: [`${process.env.KAFKA_HOST_NAME}:${process.env.KAFKA_PORT}`]
    });
    this.consumer = this.kafka.consumer({ groupId: 'tombolo' });
    this.producer = this.kafka.producer();

    (async () => {
      await this.bootstrap();
    })();
  }

  async bootstrap() {
    await this.consumer.connect();

    await this.consumer.subscribe({ topic: JOB_COMPLETE_TOPIC, fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        switch (topic) {
          case JOB_COMPLETE_TOPIC:
            this.processJob(message.value.toString());
            break;
        }
      },
    });

    await this.producer.connect();
  }

  async shutdown() {
    console.log('disconnect consumer');
    await this.consumer.disconnect();
    console.log('disconnect producer');
    await this.producer.disconnect();
    console.log('kafka shutdown');
  }

  async submitMessage(topic = '', message = '') {
    await this.producer.send({
      topic: topic,
      messages: [
        { value: message },
      ],
    });
  }

  async processJob(message) {
    try {
      let msgJson = JSON.parse(message);
      console.log(msgJson);
      if(msgJson.wuid) {
        let jobExecution = await JobExecution.findOne({where: {wuid: msgJson.wuid}});
        if(jobExecution) {
          let cluster = await hpccUtil.getCluster(jobExecution.clusterId)
          let wuInfo = await hpccUtil.workunitInfo(msgJson.wuid, cluster);
          console.log('status: '+wuInfo.Workunit.State);
          if(wuInfo.Workunit.State == 'completed' || wuInfo.Workunit.State == 'wait' || wuInfo.Workunit.State == 'blocked') {
            await JobScheduler.scheduleCheckForJobsWithSingleDependency(wuInfo.Workunit.Jobname);
          }
          await JobExecution.update({
            status: wuInfo.Workunit.State,
            wu_duration: wuInfo.Workunit.TotalClusterTime
          },
          {where: {wuid: msgJson.wuid}})
        }
      }
    } catch(err) {
      console.error(`JSON parse error ${err}`);
    }
  }
}

module.exports = new QueueDaemon();