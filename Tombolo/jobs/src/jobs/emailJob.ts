import { Job } from 'sidequest';
import logger from '../config/logger';

export class EmailJob extends Job {
  async run(to: string, subject: string, body: string) {
    logger.info(`Sending email to ${to}: ${subject}, ${body}`);
    // Your email sending logic here
    return { sent: true, timestamp: new Date() };
  }
}
