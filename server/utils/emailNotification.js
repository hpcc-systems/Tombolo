require('dotenv').config();
const nodemailer = require("nodemailer");

const sendEmailNotification = async (notificationOptions) => {
    //Creating transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
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
    if(notificationOptions.for === "manaulJob"){
        return {
            from: process.env.EMAIL_SENDER,
            to: notificationOptions.contact,
            subject: "Manaul Job awaiting your action",
            text: ``,
            html : `<p>Hello,</p>
                    <p> Below job requires your attention</p>
                    <ul>
                        <li> Name : ${notificationOptions.jobName}</li>
                        <li> Title : ${notificationOptions.jobTitle}</li>
                        <li> url : ${notificationOptions.url}</li>
                    <ul>
                    <div>
                    <b>Tombolo Team </b>
                    </div>
            `
        }
    }
  }


  //Calling send mail function provided by nodemailer and catching errs if any
  try{
    let info = await transporter.sendMail(options(notificationOptions));
    return info;
  }catch (error){
    return error;
  }
};

module.exports = {
  sendEmailNotification
}

