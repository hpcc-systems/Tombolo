import { Sidequest } from 'sidequest';
import type { SidequestConfig } from 'sidequest';
import { DB_URL } from './config/db.js';
import { registerScheduledJobs } from './scheduler.js';
import logger from './config/logger.js';

const sqConfig: SidequestConfig = {
  backend: {
    driver: '@sidequest/mysql-backend',
    config: DB_URL,
  },
  dashboard: {
    port: 8678,
  },
};

async function startSideQuest() {
  // Quick start Sidequest with default settings and Dashboard enabled
  await Sidequest.start(sqConfig);

  // Register all scheduled jobs after Sidequest starts
  registerScheduledJobs();
}

startSideQuest()
  .then(() =>
    logger.info('Sidequest started! Dashboard: http://localhost:8678'),
  )
  .catch((err) => logger.error(`Failed to start sidequest: ${err}`));
