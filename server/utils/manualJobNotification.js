require('dotenv').config();
const nodemailer = require("nodemailer");

// 🔔  Notification sender
const sendEmailNotification = async (notificationOptions) => {
  //Creating transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {},
    tls:{
        rejectUnauthorized: false
    }
  });


  // This function returns an object and assgign to option variable
  // It has email content, subject, receiver and sender info
  const options = (notificationOptions) =>{
    switch (notificationOptions.for){
    case "manaulJob" :
        return {
            from: process.env.EMAIL_SENDER,
            to: notificationOptions.contact,
            subject: "Manaul Job awaiting your action",
            text: ``,
            html : `<p>Hello,</p>
                    <p> Below job requires your attention. Please click <a href=${notificationOptions.url}>Here</a> to view job details</p>
                        <p> Name : ${notificationOptions.jobName}</p>
                        <p> Title : ${notificationOptions.jobTitle}</p>
                    <p>
                    <b>Tombolo Team </b>
                    </p>
            `
        }
      case "manualJobCompletion" :
        return {
          from: process.env.EMAIL_SENDER,
          to: notificationOptions.contact,
          subject: "Manaul Job Completed",
          text: ``,
          html : `<p>Hello,</p>
                  <p> You have ${notificationOptions.result} the job below. Please click <a href=${notificationOptions.url}>Here</a> to view job details or to modify your action.</p>
                      <p> Name : ${notificationOptions.jobName}</p>
                      <p> Title : ${notificationOptions.jobTitle}</p>
                  <p>
                  <b>Tombolo Team </b>
                  </p>
          `
        }
    }
  }


  //Calling send mail function provided by nodemailer and catching errs if any
  try{
    console.log("<<<<<<<<<<<<<<<<< Sending email notification", notificationOptions)
    let info = await transporter.sendMail(options(notificationOptions));
    console.log(info, "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< email response info")
    return info;
  }catch (error){
    console.log(error, "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< email response error")
    return error;
  }
};

module.exports = {
  sendEmailNotification
}

