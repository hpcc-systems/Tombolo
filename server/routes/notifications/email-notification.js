var nodemailer = require('nodemailer');
var smtpConfig = {
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // use SSL,
  tls : { rejectUnauthorized: false }
};
var transporter = nodemailer.createTransport(smtpConfig);

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
  const mailOptions = {
    to: notification.to,
    from: notification.from,
    subject: notification,
    text: notification.message,
    html: notification.html
  };

  transporter.sendMail(mailOptions, function(error, info){
    if(error){
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });
}

exports.notifyApplicationShare = (sharedWithUserEmail, applicationName, req) => {
  const msg={};
  msg.to = sharedWithUserEmail;
  msg.from = process.env.EMAIL_SENDER; // Use the email address or domain you verified above
  msg.subject = 'Tombolo application has been shared with you';
  msg.html = 'A Tombolo application has been shared with you. Please <a href='+req.protocol+'://'+req.get('host') +'>login</a> to Tombolo to access the application';

  module.exports.notify(msg);
}