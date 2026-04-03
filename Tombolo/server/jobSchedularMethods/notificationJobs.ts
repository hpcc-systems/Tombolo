import { join } from 'path';
import logger from '../config/logger.js';
import { getDirname } from '../utils/polyfills.js';
import { resolveJobPath } from './jobPathResolver.js';
const PROCESS_EMAIL_NOTIFICATIONS = join(
  'notifications',
  'processEmailNotifications.js'
);
const __dirname = getDirname(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scheduleEmailNotificationProcessing(this: any): Promise<void> {
  try {
    const jobName = 'email-notification-processing-' + new Date().getTime();
    await this.bree.add({
      name: jobName,
      interval: '60s', // Make it 120 seconds in production
      path: resolveJobPath(
        join(__dirname, '..', 'jobs', PROCESS_EMAIL_NOTIFICATIONS)
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    await this.bree.start(jobName);
    logger.info('E-mail Notification processing job initialized ...');
  } catch (err) {
    console.error(err);
  }
}

export { scheduleEmailNotificationProcessing };
