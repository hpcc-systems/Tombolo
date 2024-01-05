const path = require("path");

const models = require("../models");
const logger = require("../config/logger");

const SUBMIT_LANDINGZONE_FILEMONITORING_FILE_NAME =
  "submitLandingZoneFileMonitoring.js";
const SUBMIT_LOGICAL_FILEMONITORING_FILE_NAME =
  "submitLogicalFileMonitoring.js";
const SUBMIT_SUPER_FILEMONITORING_FILE_NAME = "submitSuperFileMonitoring.js";
const FILE_MONITORING = "fileMonitoringPoller.js";

const filemonitoring_superfile = models.filemonitoring_superfiles;
const FileMonitoring = models.fileMonitoring;

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
      "..",
      "jobs",
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
      "..",
      "jobs",
      SUBMIT_LOGICAL_FILEMONITORING_FILE_NAME
    ),
    worker: {
      workerData: { filemonitoring_id },
    },
  };
  this.bree.add(job);
}

function createSuperFileMonitoringBreeJob({ filemonitoring_id, cron }) {
  const uniqueJobName = `Superfile Monitoring - ${filemonitoring_id}`;
  const job = {
    cron,
    name: uniqueJobName,
    path: path.join(
      __dirname,
      "..",
      "jobs",
      SUBMIT_SUPER_FILEMONITORING_FILE_NAME
    ),
    worker: {
      workerData: { filemonitoring_id },
    },
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
}

async function scheduleSuperFileMonitoringOnServerStart() {
  try {
    logger.info("📺 SUPER FILE MONITORING STARTED ...");
    const superfileMonitoring = await filemonitoring_superfile.findAll({
      raw: true,
    });
    for (let monitoring of superfileMonitoring) {
      const { id, cron, monitoringActive } = monitoring;
      if (monitoringActive) {
        this.createSuperFileMonitoringBreeJob({
          filemonitoring_id: id,
          cron,
        });
      }
    }
  } catch (err) {
    logger.error(err);
  }
}

async function scheduleFileMonitoringBreeJob({
  filemonitoring_id,
  name,
  cron,
  monitoringAssetType,
}) {
  const uniqueName = `${name}-${filemonitoring_id}`;
  if (monitoringAssetType === "landingZoneFile") {
    this.createLandingZoneFileMonitoringBreeJob({
      filemonitoring_id,
      name: uniqueName,
      cron,
    });
    this.bree.start(uniqueName); // Starts the recently added bree job
  } else if (monitoringAssetType === "logicalFiles") {
    this.createLogicalFileMonitoringBreeJob({
      filemonitoring_id,
      name: uniqueName,
      cron,
    });
    this.bree.start(uniqueName);
  } else if (monitoringAssetType === "superFiles") {
    this.createSuperFileMonitoringBreeJob({
      filemonitoring_id,
      name: uniqueName,
      cron,
    });
  }
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
    logger.error(err);
  }
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
    logger.error(err);
  }
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
    logger.error(err);
  }
}

async function scheduleFileMonitoring() {
  logger.info("📂 FILE MONITORING STARTED ...");
  try {
    let jobName = "file-monitoring-" + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: "500s",
      path: path.join(__dirname, "..", "jobs", FILE_MONITORING),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    this.bree.start(jobName);
  } catch (err) {
    logger.error(err);
  }
}

module.exports = {
  createLandingZoneFileMonitoringBreeJob,
  createLogicalFileMonitoringBreeJob,
  createSuperFileMonitoringBreeJob,
  scheduleSuperFileMonitoringOnServerStart,
  scheduleFileMonitoringBreeJob,
  scheduleFileMonitoringOnServerStart,
  scheduleFileMonitoring,
};
