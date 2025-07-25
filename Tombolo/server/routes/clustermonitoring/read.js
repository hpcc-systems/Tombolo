const { clusterMonitoring: ClusterMonitoring } = require('../../models');
const express = require('express');
const logger = require('../../config/logger');
const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateCreateClusterMonitoring,
  validateGetClusterMonitorings,
  validateGetClusterMonitoring,
  validateDeleteClusterMonitoring,
  validateStartStopClusterMonitoring,
  validateUpdateClusterMonitoring,
  validateGetClusterMonitoringEngines,
  validateGetClusterUsage,
} = require('../../middlewares/clusterMonitoringMiddleware');
const hpccJSComms = require('@hpcc-js/comms');
const hpccUtil = require('../../utils/hpcc-util');
const JobScheduler = require('../../jobSchedular/job-scheduler');
const { getClusterOptions } = require('../../utils/getClusterOptions');

const router = express.Router();

// Create Cluster Monitoring
router.post(
  '/',
  validate(validateCreateClusterMonitoring),
  async (req, res) => {
    try {
      const clusterMonitoring = await ClusterMonitoring.create(req.body);

      res.status(201).send(clusterMonitoring);

      //Add job to bree- if start monitoring checked
      const { id, name, cron } = clusterMonitoring;
      if (req.body.isActive) {
        JobScheduler.createClusterMonitoringBreeJob({
          clusterMonitoring_id: id,
          name,
          cron,
        });
      }
    } catch (err) {
      logger.error(err);
      return res
        .status(503)
        .send({ success: false, message: 'Failed to fetch' });
    }
  }
);

// Get all cluster monitoring
router.get(
  '/all/:application_id',
  validate(validateGetClusterMonitorings),
  async (req, res) => {
    try {
      const { application_id } = req.params;
      const clusterMonitorings = await ClusterMonitoring.findAll({
        where: { application_id },
        raw: true,
      });

      return res.status(200).send(clusterMonitorings);
    } catch (err) {
      logger.error(err);
      return res.send(503).send({ success: false, message: 'Failed to fetch' });
    }
  }
);

// Get one cluster monitoring
router.get('/:id', validate(validateGetClusterMonitoring), async (req, res) => {
  try {
    const { id } = req.params;
    const clusterMonitoring = await ClusterMonitoring.findOne({
      where: { id },
      raw: true,
    });
    return res.status(200).send(clusterMonitoring);
  } catch (err) {
    logger.error(err);
    return res.status(503).send({ success: false, message: 'Failed to fetch' });
  }
});

//Delete
router.delete(
  '/:id',
  validate(validateDeleteClusterMonitoring),
  async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await ClusterMonitoring.destroy({
        where: { id },
      });

      return res.status(200).send({ deleted });
    } catch (err) {
      logger.error(err);
      return res
        .status(503)
        .json({ success: false, message: 'Failed to delete' });
    }
  }
);

// Pause or start monitoring
router.put(
  '/clusterMonitoringStatus/:id',
  validate(validateStartStopClusterMonitoring),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const monitoring = await ClusterMonitoring.findOne({
        where: { id },
        raw: true,
      });
      const { cron, isActive } = monitoring;

      // flipping isActive
      await ClusterMonitoring.update(
        { isActive: !isActive },
        { where: { id: id } }
      );

      // If isActive, it is in bre - remove from bree
      if (isActive) {
        await JobScheduler.removeJobFromScheduler(`Cluster Monitoring - ${id}`);
      }

      // If isActive = false, add it to bre
      if (!isActive) {
        JobScheduler.createClusterMonitoringBreeJob({
          clusterMonitoring_id: id,
          cron,
        });
      }

      return res.status(200).send('Update successful');
    } catch (err) {
      logger.error(err);
      return res
        .status(500)
        .json({ message: 'Failed to update monitoring status' });
    }
  }
);

// Update Monitoring
router.put('/', validate(validateUpdateClusterMonitoring), async (req, res) => {
  try {
    //Existing cluster monitoring details
    let { id, isActive, cron } = req.body;

    const existingMonitoringDetails = await ClusterMonitoring.findOne({
      where: { id },
    });
    const {
      metaData: { last_monitored },
    } = existingMonitoringDetails;

    const newData = req.body; // Cleaning required
    // Do not reset last_monitored value
    newData.metaData.last_monitored = last_monitored;

    const updated = await ClusterMonitoring.update(newData, {
      where: { id },
    });

    res.status(200).send({ updated });
    if (updated == 1) {
      const monitoringUniqueName = `Cluster Monitoring - ${id}`;
      const breeJobs = JobScheduler.getAllJobs();
      const jobIndex = breeJobs.findIndex(
        job => job.name === monitoringUniqueName
      );

      //Add to bree
      if (jobIndex > 0 && !isActive) {
        JobScheduler.removeAllFromBree(monitoringUniqueName);
      }

      // Remove from bree
      if (jobIndex < 0 && isActive) {
        JobScheduler.createClusterMonitoringBreeJob({
          clusterMonitoring_id: id,
          cron,
        });
      }
    }
  } catch (err) {
    logger.error(err);
    return res
      .status(503)
      .json({ success: false, message: 'Failed to update' });
  }
});

// Get cluster monitoring engines
router.get(
  '/clusterEngines/:cluster_id',
  validate(validateGetClusterMonitoringEngines),
  async (req, res) => {
    try {
      const { cluster_id } = req.params;
      let cluster = await hpccUtil.getCluster(cluster_id);
      const { thor_host, thor_port, username, hash, allowSelfSigned } = cluster;
      const clusterDetails = getClusterOptions(
        {
          baseUrl: `${thor_host}:${thor_port}`,
          userID: username || '',
          password: hash || '',
        },
        allowSelfSigned
      );
      const topologyService = new hpccJSComms.TopologyService(clusterDetails);
      const clusterEngines = await topologyService.TpListTargetClusters();
      return res.status(200).send(clusterEngines);
    } catch (err) {
      logger.error(err);
      return res
        .status(503)
        .json({ success: false, message: 'Failed to get engines' });
    }
  }
);

// Get target cluster usage
router.get(
  '/targetClusterUsage/:cluster_id',
  validate(validateGetClusterUsage),
  async (req, res) => {
    try {
      const { cluster_id } = req.params;
      const { engines } = req.body;

      let cluster = await hpccUtil.getCluster(cluster_id);
      const { thor_host, thor_port, username, hash, allowSelfSigned } = cluster;
      const clusterDetails = getClusterOptions(
        {
          baseUrl: `${thor_host}:${thor_port}`,
          userID: username || '',
          password: hash || '',
        },
        allowSelfSigned
      );
      const machineService = new hpccJSComms.MachineService(clusterDetails);

      const targetClusterUsage =
        await machineService.GetTargetClusterUsageEx(engines);
      const clusterUsage = [];
      targetClusterUsage.forEach(function (details) {
        clusterUsage.push({
          engine: details.Name,
          size: details.max,
        });
      });

      return res.status(200).send(clusterUsage);
    } catch (err) {
      logger.error(err);
      return res
        .status(503)
        .json({ success: false, message: 'Failed to get cluster usage' });
    }
  }
);

module.exports = router;
