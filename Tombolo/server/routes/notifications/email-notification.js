var nodemailer = require('nodemailer');
var smtpConfig = {
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // use SSL,
  tls : { rejectUnauthorized: false }
};
var transporter = nodemailer.createTransport(smtpConfig);
exports.notify = (notification) => {
  return new Promise((resolve,reject)=>{
  const mailOptions = {
    to: notification.to,
    from: notification.from,
    subject: notification.subject,
    text: notification.message,
    html: notification.html
  };
  transporter.sendMail(mailOptions, function(error, info){
    if(error){
       reject(error);
    }
    resolve(info);
  });
})
}

exports.notifyApplicationShare = (sharedWithUserEmail, applicationName) => {
  const msg={};
  msg.to = sharedWithUserEmail;
  msg.from = process.env.EMAIL_SENDER; // Use the email address or domain you verified above
  msg.subject = 'Tombolo application has been shared with you';
  msg.html = `A Tombolo application (${applicationName}) has been shared with you. Please <a href=${process.env.WEB_URL}/login>login</a> to Tombolo to access the application`;

  module.exports.notify(msg);
}