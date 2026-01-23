import path from 'path';
import logger from '../config/logger.js';

async function removeUnverifiedUser() {
  try {
    let jobName = 'remove-unverified-users-' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: '3600s',
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'userManagement',
        'removeUnverifiedUsers.js'
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    this.bree.start(jobName);
    logger.info('User management (remove unverified user) initialized ...');
  } catch (err) {
    logger.error('userManagementJobs - removeUnverifiedUser: ', err);
  }
}

async function sendPasswordExpiryEmails() {
  try {
    let jobName = 'password-expiry-' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: '12h',
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'userManagement',
        'passwordExpiry.js'
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    this.bree.start(jobName);
    logger.info(
      'User management (send password expiry emails) initialized ...'
    );
  } catch (err) {
    logger.error('userManagementJobs - sendPasswordExpiryEmails: ', err);
  }
}

async function sendAccountDeleteEmails() {
  try {
    let jobName = 'account-delete-' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: '12h',
      path: path.join(
        __dirname,
        '..',
        'jobs',
        'userManagement',
        'accountDelete.js'
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    this.bree.start(jobName);
    logger.info('User management (account inactivity emails) initialized ...');
  } catch (err) {
    logger.error('userManagementJobs - sendAccountDeleteEmails: ', err);
  }
}

export {
  removeUnverifiedUser,
  sendPasswordExpiryEmails,
  sendAccountDeleteEmails,
};
