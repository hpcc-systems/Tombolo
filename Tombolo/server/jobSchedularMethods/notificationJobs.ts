import path from 'path';
import logger from '../config/logger.js';
import { getDirname } from '../utils/polyfills.js';
import { resolveJobPath } from './jobPathResolver.js';
const PROCESS_EMAIL_NOTIFICATIONS = path.join(
  'notifications',
  'processEmailNotifications.js'
);
const __dirname = getDirname(import.meta.url);

async function scheduleEmailNotificationProcessing(this: any): Promise<void> {
  try {
    let jobName = 'email-notification-processing-' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: '60s', // Make it 120 seconds in production
      path: resolveJobPath(
        path.join(__dirname, '..', 'jobs', PROCESS_EMAIL_NOTIFICATIONS)
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    this.bree.start(jobName);
    logger.info('E-mail Notification processing job initialized ...');
  } catch (err) {
    console.error(err);
  }
}

export { scheduleEmailNotificationProcessing };
