const express = require('express');
const logger = require('../../config/logger');
const router = express.Router();
const { fileMonitoring: FileMonitoring } = require('../../models');
const jobScheduler = require('../../jobSchedular/job-scheduler');
const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateCreateFileMonitoring,
  validateGetFileMonitorings,
  validateGetFileMonitoring,
  validateDeleteFileMonitoring,
  validateToggleFileMonitoring,
  validateUpdateFileMonitoring,
} = require('../../middlewares/fileMonitoringMiddleware');
const {
  uniqueConstraintErrorHandler,
} = require('../../utils/uniqueConstraintErrorHandler');

router.post('/', validate(validateCreateFileMonitoring), async (req, res) => {
  try {
    const { monitoringAssetType, monitoringActive } = req.body;
    const fileMonitoring = await FileMonitoring.create(req.body);
    res.status(201).send(fileMonitoring);

    // Add monitoring to bree if start monitoring now is checked
    if (monitoringActive) {
      const schedularOptions = {
        filemonitoring_id: fileMonitoring.id,
        name: fileMonitoring.name,
        cron: fileMonitoring.cron,
        monitoringAssetType,
      };
      jobScheduler.scheduleFileMonitoringBreeJob(schedularOptions);
    }
  } catch (error) {
    logger.error('Failed to create file monitoring: ', error);
    const errorResult = uniqueConstraintErrorHandler(
      error,
      'Unable to save file monitoring details'
    );
    return res.status(errorResult.statusCode).json(errorResult.responseObject);
  }
});

// Get file monitoring [ All of them ]
router.get(
  '/all/:application_id',
  validate(validateGetFileMonitorings),
  async (req, res) => {
    try {
      const { application_id } = req.params;

      const fileMonitoring = await FileMonitoring.findAll({
        where: { application_id },
        raw: true,
      });

      return res.status(200).send(fileMonitoring);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ message: 'Unable to get file monitoring' });
    }
  }
);

// Get file monitoring [ One of them ]
router.get(
  '/:file_monitoring_id',
  validate(validateGetFileMonitoring),
  async (req, res) => {
    try {
      const { file_monitoring_id } = req.params;

      const fileMonitoring = await FileMonitoring.findOne({
        where: { id: file_monitoring_id },
        raw: true,
      });

      return res.status(200).send(fileMonitoring);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ message: 'Unable to get file monitoring' });
    }
  }
);

//Delete File Monitoring
router.delete(
  '/:fileMonitoringId/:fileMonitoringName',
  validate(validateDeleteFileMonitoring),
  async (req, res) => {
    try {
      const { fileMonitoringId, fileMonitoringName } = req.params;
      const response = await FileMonitoring.destroy({
        where: { id: fileMonitoringId },
      });
      res.status(200).json({ message: `Deleted ${response} file monitoring` });

      //Check if this job is in bree - if so - remove
      const breeJobs = jobScheduler.getAllJobs();
      const expectedJobName = `${fileMonitoringName}-${fileMonitoringId}`;
      for (job of breeJobs) {
        if (job.name === expectedJobName) {
          jobScheduler.removeJobFromScheduler(expectedJobName);
          break;
        }
      }
    } catch (err) {
      logger.error(err);
      return res.status(500).json({ message: err.message });
    }
  }
);

// Pause or start monitoring
router.put(
  '/fileMonitoringStatus/:id',
  validate(validateToggleFileMonitoring),
  async (req, res) => {
    try {
      const { id } = req.params;
      const monitoring = await FileMonitoring.findOne({
        where: { id },
        raw: true,
      });
      const { name, cron, monitoringActive, monitoringAssetType } = monitoring;

      // flipping monitoringActive
      await FileMonitoring.update(
        { monitoringActive: !monitoringActive },
        { where: { id: id } }
      );

      // If monitoringActive, it is in bre - remove from bree
      if (monitoringActive) {
        await jobScheduler.removeJobFromScheduler(`${name}-${id}`);
      }

      // If monitoringActive = false, add it to bre
      if (!monitoringActive) {
        await jobScheduler.scheduleFileMonitoringBreeJob({
          filemonitoring_id: id,
          name,
          cron,
          monitoringAssetType,
        });
      }

      return res.status(200).send('Update successful');
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Failed to update monitoring status');
    }
  }
);

router.put('/', validate(validateUpdateFileMonitoring), async (req, res) => {
  try {
    const oldInfo = await FileMonitoring.findOne({
      where: { id: req.body.id },
      raw: true,
    });

    const {
      metaData: { currentlyMonitoring },
    } = oldInfo;

    const newInfo = req.body;
    if (currentlyMonitoring) {
      newInfo.metaData.currentlyMonitoring = currentlyMonitoring;
    }

    const { id, name, cron, monitoringActive, monitoringAssetType } = newInfo;

    await FileMonitoring.update(newInfo, { where: { id } });
    const fileMonitoringDetails = FileMonitoring.findOne({ where: { id } }); // To avoid xss waring making additional call
    res.status(200).send(fileMonitoringDetails);

    // If start monitoring was changed to TRUE
    if (monitoringActive && oldInfo.monitoringActive == 0) {
      const schedularOptions = {
        filemonitoring_id: id,
        name: name,
        cron: cron,
        monitoringAssetType,
      };
      await jobScheduler.scheduleFileMonitoringBreeJob(schedularOptions);
    }

    // If start monitoring was changed to FALSE
    if (!monitoringActive && oldInfo.monitoringActive == 1) {
      await jobScheduler.removeJobFromScheduler(`${name}-${id}`);
    }

    // if cron has changed
    if (oldInfo.cron != cron) {
      const allBreeJobs = jobScheduler.getAllJobs();
      const jobName = `${name}-${id}`;
      for (let job of allBreeJobs) {
        if (job.name === jobName) {
          await jobScheduler.removeJobFromScheduler(jobName);
          await jobScheduler.scheduleFileMonitoringBreeJob({
            filemonitoring_id: id,
            name: name,
            cron: cron,
            monitoringAssetType,
          });
        }
      }
    }
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ message: 'Unable to save file monitoring details' });
  }
});

module.exports = router;
