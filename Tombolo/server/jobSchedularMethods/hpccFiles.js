const path = require('path');

const { FileMonitoring } = require('../models');
const logger = require('../config/logger');

const SUBMIT_LANDINGZONE_FILEMONITORING_FILE_NAME =
  'submitLandingZoneFileMonitoring.js';
const SUBMIT_LOGICAL_FILEMONITORING_FILE_NAME =
  'submitLogicalFileMonitoring.js';
const FILE_MONITORING = 'fileMonitoringPoller.js';

function createLandingZoneFileMonitoringBreeJob({
  filemonitoring_id,
  name,
  cron,
}) {
  const job = {
    cron,
    name,
    path: path.join(
      __dirname,
      '..',
      'jobs',
      SUBMIT_LANDINGZONE_FILEMONITORING_FILE_NAME
    ),
    worker: {
      workerData: { filemonitoring_id },
    },
  };
  this.bree.add(job);
}

function createLogicalFileMonitoringBreeJob({ filemonitoring_id, name, cron }) {
  const job = {
    cron,
    name,
    path: path.join(
      __dirname,
      '..',
      'jobs',
      SUBMIT_LOGICAL_FILEMONITORING_FILE_NAME
    ),
    worker: {
      workerData: { filemonitoring_id },
    },
  };
  this.bree.add(job);
}

async function scheduleFileMonitoringOnServerStart() {
  try {
    const activeLandingZoneFileMonitoring = await FileMonitoring.findAll({
      where: {
        monitoringActive: true,
        // monitoringAssetType: "landingZoneFile",
      },
      raw: true,
    });
    for (const monitoring of activeLandingZoneFileMonitoring) {
      await this.scheduleFileMonitoringBreeJob({
        filemonitoring_id: monitoring.id,
        name: monitoring.name,
        cron: monitoring.cron,
        monitoringAssetType: monitoring.monitoringAssetType,
      });
    }
  } catch (err) {
    logger.error('hpccFiles - scheduleFileMonitoringOnServerStart: ', err);
  }
}

async function scheduleFileMonitoring() {
  logger.info('File monitoring initialized ...');
  try {
    let jobName = 'file-monitoring-' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: '500s',
      path: path.join(__dirname, '..', 'jobs', FILE_MONITORING),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    this.bree.start(jobName);
  } catch (err) {
    logger.error('hpccFiles - scheduleFileMonitoring: ', err);
  }
}

module.exports = {
  createLandingZoneFileMonitoringBreeJob,
  createLogicalFileMonitoringBreeJob,
  scheduleFileMonitoringOnServerStart,
  scheduleFileMonitoring,
};
