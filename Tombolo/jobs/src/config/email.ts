import nodemailer from 'nodemailer';

const smtpConfig: any = {
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  tls: { rejectUnauthorized: false },
  sender: process.env.EMAIL_SENDER,
  timeout: 10000,
};

if (
  typeof process.env.EMAIL_USER === 'string' &&
  process.env.EMAIL_USER.trim().length > 0
) {
  smtpConfig.auth = {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  };
}

const transporter = nodemailer.createTransport(smtpConfig);

export const sendEmail = ({
  receiver,
  cc,
  subject,
  plainTextBody,
  htmlBody,
}: {
  receiver: string;
  cc?: string;
  subject: string;
  plainTextBody?: string;
  htmlBody?: string;
}): Promise<any> => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: smtpConfig.sender,
      to: receiver,
      cc,
      subject,
      text: plainTextBody,
      html: htmlBody,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(info);
    });
  });
};
