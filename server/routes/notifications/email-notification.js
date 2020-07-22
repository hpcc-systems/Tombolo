var kafka = require('kafka-node'),    
    ConsumerGroup = kafka.ConsumerGroup;
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var kafkaConsumerOptions = {
  kafkaHost: process.env.KAFKA_ADVERTISED_LISTENER + ':' + process.env.KAFKA_PORT, // connect directly to kafka broker (instantiates a KafkaClient)
  batch: undefined, 
  ssl: false, 
  groupId: 'ExampleTestGroup',
  sessionTimeout: 15000,
  protocol: ['roundrobin'],
  encoding: 'utf8', // default is utf8, use 'buffer' for binary data
  fromOffset: 'latest', // default
  commitOffsetsOnFirstJoin: true, // on the very first time this consumer group subscribes to a topic, record the offset returned in fromOffset (latest/earliest)
  outOfRangeOffset: 'earliest'
};    

exports.notify = (notification) => {
  const msg={};
  if(notification.type == 'Covid19') {
    msg.to = 'hpcc-solutions-lab@lexisnexisrisk.com';
    msg.from = 'hpcc-solutions-lab@lexisnexisrisk.com'; // Use the email address or domain you verified above
    msg.subject = 'Covid19 Notification';
    msg.text = notification.message
  }

  sgMail
  .send(msg)
  .then(() => {}, error => {
    console.error(error);

    if (error.response) {
      console.error(error.response.body)
    }
  });
} 

var consumerGroup = new ConsumerGroup(kafkaConsumerOptions, 'Notifications');
consumerGroup.on('message', (response) => {
  console.log(response.value);  
  if(response != undefined) {    
    let parsedResponse = JSON.parse(response.value);
    module.exports.notify(parsedResponse);    
  }
});

consumerGroup.on('error', (error) => {
  console.log('Notification Consumer error occured: '+error);
});  