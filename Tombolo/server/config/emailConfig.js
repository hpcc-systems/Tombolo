/*
1. The send Email function treats emails as sent if the SMTP server accepts the email for delivery.
2. It does not guarantee that the email will be delivered to the recipient's inbox.
   For example -  if the user provided email is correctly formatted but not a valid email address,
   the SMTP server will accept the email for delivery but will not deliver it to the recipient's inbox.
3. To Debug email delivery issues, first check notification_queue table. if it does not exists there check  table that stores sent notification.
   Next application Logs and SMTP server logs if available.
*/

//Packages imports
import nodemailer from 'nodemailer';

// SMTP configuration
const smtpConfig = {
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // use SSL,
  tls: { rejectUnauthorized: false },
  sender: process.env.EMAIL_SENDER,
  timeout: 10000, // in milliseconds
  debug: true, // set debug to true to see debug logs
};

if (
  process.env.EMAIL_USER === 'string' &&
  process.env.EMAIL_USER.trim().length > 0
) {
  smtpConfig.auth = {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  };
}

//Create transporter
const transporter = nodemailer.createTransport(smtpConfig);

// Send email function
const sendEmail = ({ receiver, cc, subject, plainTextBody, htmlBody }) => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: smtpConfig.sender,
      to: receiver,
      cc: cc,
      subject: subject,
      text: plainTextBody ? plainTextBody : null,
      html: htmlBody ? htmlBody : null,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        reject(error);
      }
      resolve(info);
    });
  });
};

// Re-try options
const retryOptions = {
  maxRetries: 3,
  retryDelays: [1, 2, 3], // in minutes - Exponential backoff strategy
};

// Exports
export { sendEmail, retryOptions };
