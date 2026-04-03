import { join } from 'path';
import logger from '../config/logger.js';
import { getDirname } from '../utils/polyfills.js';
import { resolveJobPath } from './jobPathResolver.js';

const __dirname = getDirname(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function removeUnverifiedUser(this: any): Promise<void> {
  try {
    const jobName = 'remove-unverified-users-' + new Date().getTime();
    await this.bree.add({
      name: jobName,
      interval: '3600s',
      path: resolveJobPath(
        join(
          __dirname,
          '..',
          'jobs',
          'userManagement',
          'removeUnverifiedUsers.js'
        )
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    await this.bree.start(jobName);
    logger.info('User management (remove unverified user) initialized ...');
  } catch (err) {
    logger.error('userManagementJobs - removeUnverifiedUser: ', err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendPasswordExpiryEmails(this: any): Promise<void> {
  try {
    const jobName = 'password-expiry-' + new Date().getTime();
    await this.bree.add({
      name: jobName,
      interval: '12h',
      path: resolveJobPath(
        join(__dirname, '..', 'jobs', 'userManagement', 'passwordExpiry.js')
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    await this.bree.start(jobName);
    logger.info(
      'User management (send password expiry emails) initialized ...'
    );
  } catch (err) {
    logger.error('userManagementJobs - sendPasswordExpiryEmails: ', err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendAccountDeleteEmails(this: any): Promise<void> {
  try {
    const jobName = 'account-delete-' + new Date().getTime();
    await this.bree.add({
      name: jobName,
      interval: '12h',
      path: resolveJobPath(
        join(__dirname, '..', 'jobs', 'userManagement', 'accountDelete.js')
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    await this.bree.start(jobName);
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
