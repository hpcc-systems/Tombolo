const path = require('path');
const logger = require('../config/logger');

const { OrbitMonitoring } = require('../models');

const MEGAPHONE_JOB = 'orbitMegaphone.js';
const ORBIT_MONITORING = 'submitOrbitMonitoring.js';
const ORBIT_PROFILE_MONITORING = 'monitorOrbitProfile.js';

function createOrbitMegaphoneJob() {
  const uniqueJobName = 'Orbit Megaphone Job';
  const job = {
    interval: '30m',
    name: uniqueJobName,
    path: path.join(__dirname, '..', 'jobs', MEGAPHONE_JOB),
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
  logger.info('Orbit megaphone job initialized ...');
}

function createOrbitMonitoringJob({ orbitMonitoring_id, cron }) {
  const uniqueJobName = `Orbit Monitoring - ${orbitMonitoring_id}`;
  const job = {
    cron,
    name: uniqueJobName,
    path: path.join(__dirname, '..', 'jobs', ORBIT_MONITORING),
    worker: {
      workerData: { orbitMonitoring_id },
    },
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
}

function createOrbitProfileMonitoringJob({
  uniqueJobName = 'Orbit Profile Monitoring',
} = {}) {
  const jobName = uniqueJobName;
  const job = {
    interval: '10s',
    name: jobName,
    path: path.join(
      __dirname,
      '..',
      'jobs',
      'orbitProfileMonitoring',
      ORBIT_PROFILE_MONITORING
    ),
  };
  this.bree.add(job);
  this.bree.start(jobName);
  logger.info(`Orbit profile monitoring job scheduled ...`);
}

async function scheduleOrbitMonitoringOnServerStart() {
  try {
    logger.info('Orbit monitoring initialized ...');
    const orbitMonitorings = await OrbitMonitoring.findAll({ raw: true });
    for (let monitoring of orbitMonitorings) {
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

module.exports = {
  createOrbitMegaphoneJob,
  createOrbitMonitoringJob,
  createOrbitProfileMonitoringJob,
  scheduleOrbitMonitoringOnServerStart,
};
