import { join } from 'path';
import Bree from 'bree';
import logger from '../config/logger.js';
import { resolveJobPath } from './jobPathResolver.js';

import { OrbitMonitoring } from '../models/index.js';
import { getDirname } from '../utils/polyfills.js';

const __dirname = getDirname(import.meta.url);
const MEGAPHONE_JOB = 'orbitMegaphone.js';
const ORBIT_MONITORING = 'submitOrbitMonitoring.js';
const ORBIT_PROFILE_MONITORING = 'monitorOrbitProfile.js';

async function createOrbitMegaphoneJob(this: { bree: Bree }): Promise<void> {
  const uniqueJobName = 'Orbit Megaphone Job';
  const defaultDistPath = join(
    __dirname,
    '..',
    '..',
    'dist',
    'jobs',
    MEGAPHONE_JOB
  );
  const job = {
    interval: '30m',
    name: uniqueJobName,
    path: resolveJobPath(defaultDistPath),
  };
  await this.bree.add(job);
  await this.bree.start(uniqueJobName);
  logger.info('Orbit megaphone job initialized ...');
}

async function createOrbitMonitoringJob(
  this: { bree: Bree },
  { orbitMonitoring_id, cron }: { orbitMonitoring_id: string; cron: string }
): Promise<void> {
  const uniqueJobName = `Orbit Monitoring - ${orbitMonitoring_id}`;
  const defaultDistPath2 = join(
    __dirname,
    '..',
    '..',
    'dist',
    'jobs',
    ORBIT_MONITORING
  );
  const job = {
    cron,
    name: uniqueJobName,
    path: resolveJobPath(defaultDistPath2),
    worker: {
      workerData: { orbitMonitoring_id },
    },
  };
  await this.bree.add(job);
  await this.bree.start(uniqueJobName);
}

async function createOrbitProfileMonitoringJob(
  this: { bree: Bree },
  {
    uniqueJobName = 'Orbit Profile Monitoring',
  }: { uniqueJobName?: string } = {}
): Promise<void> {
  const jobName = uniqueJobName;
  const defaultDistPath3 = join(
    __dirname,
    '..',
    '..',
    'dist',
    'jobs',
    'orbitProfileMonitoring',
    ORBIT_PROFILE_MONITORING
  );
  const job = {
    interval: '30m',
    name: jobName,
    path: resolveJobPath(defaultDistPath3),
  };
  await this.bree.add(job);
  await this.bree.start(jobName);
  logger.info(`Orbit profile monitoring job scheduled ...`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scheduleOrbitMonitoringOnServerStart(this: any): Promise<void> {
  try {
    logger.info('Orbit monitoring initialized ...');
    const orbitMonitorings = await OrbitMonitoring.findAll({ raw: true });
    for (const monitoring of orbitMonitorings) {
      const { id, cron, isActive } = monitoring;
      if (isActive) {
        this.createOrbitMonitoringJob({
          orbitMonitoring_id: id,
          cron,
        });
      }
    }
  } catch (err) {
    logger.error('Failed to start orbit monitoring', err);
  }
}

export {
  createOrbitMegaphoneJob,
  createOrbitMonitoringJob,
  createOrbitProfileMonitoringJob,
  scheduleOrbitMonitoringOnServerStart,
};
