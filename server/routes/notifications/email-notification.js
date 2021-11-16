var nodemailer = require('nodemailer');
var smtpConfig = {
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // use SSL,
  tls : { rejectUnauthorized: false }
};
var transporter = nodemailer.createTransport(smtpConfig);

exports.notify =   async (notification) => {
  const mailOptions = {
    to: notification.to,
    from: notification.from,
    subject: notification.subject,
    text: notification.message,
    html: notification.html
  };

  try{
   const response = await transporter.sendMail(mailOptions)
   console.log("Email sent success ")
   return response;
  }catch(err){
    console.log("Unable to send E-mail", err)
    return err;
  }

}

exports.notifyApplicationShare = (sharedWithUserEmail, applicationName, req) => {
  const msg={};
  msg.to = sharedWithUserEmail;
  msg.from = process.env.EMAIL_SENDER; // Use the email address or domain you verified above
  msg.subject = 'Tombolo application has been shared with you';
  msg.html = 'A Tombolo application has been shared with you. Please <a href='+req.protocol+'://'+req.get('host') +'>login</a> to Tombolo to access the application';

  module.exports.notify(msg);
}