const { Kafka } = require('kafkajs');
const { fs } = require('fs');
const models = require('./models');
const DependentJobs = models.dependent_jobs;
const JobScheduler = require('./job-scheduler');

require('dotenv').config();

const JOB_COMPLETE_TOPIC = 'JobComplete';

class QueueDaemon {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'tombolo',
      brokers: [`${process.env.KAFKA_HOST_NAME}:${process.env.KAFKA_PORT}`]
    });
    this.consumer = this.kafka.consumer({ groupId: 'tombolo' });
    this.producer = this.kafka.producer();

    (async () => {
      console.log('running QueueDaemon bootstrap...');
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
      console.log(message)
      let msgJson = JSON.parse(message);
      console.log(`Topic "${JOB_COMPLETE_TOPIC}" - JSON msg received: ${message}`);
      JobScheduler.scheduleCheckForJobsWithSingleDependency(msgJson.name)
    } catch(err) {
      console.error(`JSON parse error ${err}`);
    }
  }
}

module.exports = new QueueDaemon();