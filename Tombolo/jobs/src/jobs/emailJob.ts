import { Job } from 'sidequest';

export class EmailJob extends Job {
  async run(to: string, subject: string, body: string) {
    console.log(`Sending email to ${to}: ${subject}, ${body}`);
    // Your email sending logic here
    return { sent: true, timestamp: new Date() };
  }
}
