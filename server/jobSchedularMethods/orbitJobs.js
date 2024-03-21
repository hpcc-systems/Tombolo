const path = require("path");
const logger = require("../config/logger");

const models = require("../models");
orbitMonitoring = models.orbitMonitoring;

const MEGAPHONE_JOB = "orbitMegaphone.js";
const ORBIT_MONITORING = "submitOrbitMonitoring.js";

function createOrbitMegaphoneJob() {
  const uniqueJobName = `Orbit Megaphone Job`;
  const job = {
    interval: "15s",
    name: uniqueJobName,
    path: path.join(__dirname, "..", "jobs", MEGAPHONE_JOB),
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
  logger.info("📈 ORBIT MEGAPHONE JOB STARTED ...");
}

function createOrbitMonitoringJob({ orbitMonitoring_id, cron }) {
  const uniqueJobName = `Orbit Monitoring - ${orbitMonitoring_id}`;
  const job = {
    cron,
    name: uniqueJobName,
    path: path.join(__dirname, "..", "jobs", ORBIT_MONITORING),
    worker: {
      workerData: { orbitMonitoring_id },
    },
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
}

async function scheduleOrbitMonitoringOnServerStart() {
  try {
    logger.info("📺 ORBIT MONITORING STARTED ...");
    const orbitMonitorings = await orbitMonitoring.findAll({ raw: true });
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
    logger.error(err);
  }
}

module.exports = {
  createOrbitMegaphoneJob,
  createOrbitMonitoringJob,
  scheduleOrbitMonitoringOnServerStart,
};
