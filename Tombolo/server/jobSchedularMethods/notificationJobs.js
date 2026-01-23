import path from 'path';
import logger from '../config/logger.js';
const PROCESS_EMAIL_NOTIFICATIONS = path.join(
  'notifications',
  'processEmailNotifications.js'
);

async function scheduleEmailNotificationProcessing() {
  try {
    let jobName = 'email-notification-processing-' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: '60s', // Make it 120 seconds in production
      path: path.join(__dirname, '..', 'jobs', PROCESS_EMAIL_NOTIFICATIONS),
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

// async function scheduleTeamsNotificationProcessing() {
//   try {
//     let jobName = 'teams-notification-processing-' + new Date().getTime();
//     this.bree.add({
//       name: jobName,
//       interval: '60s', // Make it 120 seconds in production
//       path: path.join(__dirname, '..', 'jobs', PROCESS_TEAMS_NOTIFICATIONS),
//       worker: {
//         workerData: {
//           jobName: jobName,
//           WORKER_CREATED_AT: Date.now(),
//         },
//       },
//     });
//
//     this.bree.start(jobName);
//     logger.info('Teams notification processing job initialized ...');
//   } catch (err) {
//     console.error(err);
//   }
// }

export {
  scheduleEmailNotificationProcessing,
  // scheduleTeamsNotificationProcessing,
};
