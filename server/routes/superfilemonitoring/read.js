const express = require("express");
// const logger = require("../../config/logger");
const router = express.Router();
const models = require("../../models");
const jobScheduler = require("../../job-scheduler");
const SuperFileMonitoring = models.filemonitoring_superfiles;
const validatorUtil = require("../../utils/validator");
const hpccUtil = require("../../utils/hpcc-util.js");
const { body, param, validationResult } = require("express-validator");

router.post(
  "/",
  [
    body("application_id").isUUID(4).withMessage("Invalid application id"),
    body("cluster_id")
      .isUUID(4)
      .optional({ nullable: false })
      .withMessage("Invalid cluster id"),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      //grab data from
      // const superfileInfo = await hpccUtil.getSuperFile(
      //   req.body.cluster_id,
      //   req.body.fileName
      // );

      let newSuperFileData = {
        clusterid: req.body.cluster_id,
        application_id: req.body.application_id,
        cron: req.body.cron,
        name: req.body.monitorName,
        superfile_name: req.body.metaData.fileInfo.Name,
        metaData: req.body.metaData,
        monitoringActive: req.body.monitoringActive,
      };

      let recentSubFile = await hpccUtil.getRecentSubFile(
        newSuperFileData.clusterid,
        newSuperFileData.superfile_name
      );
      //set metaData with most recent file
      newSuperFileData.metaData.fileInfo.mostRecentSubFile =
        recentSubFile.recentSubFile;

      newSuperFileData.metaData.fileInfo.mostRecentSubFileDate =
        recentSubFile.recentDate.getTime().toString();

      newSuperFileData.metaData.fileInfo.subfileCount =
        recentSubFile.subfileCount;

      const newSuperFile = await SuperFileMonitoring.create(newSuperFileData);

      res.status(200).send(newSuperFile);

      const { monitoringActive } = req.body;
      let monitoringAssetType = "superFiles";

      //Add monitoring to bree if start monitoring now is checked
      if (monitoringActive) {
        const schedularOptions = {
          filemonitoring_id: newSuperFile.id,
          name: newSuperFile.name,
          cron: newSuperFile.cron,
          monitoringAssetType,
        };

        jobScheduler.scheduleFileMonitoringBreeJob(schedularOptions);
      }
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Unable to save file monitoring details" });
    }
  }
);

// Get all superfile monitors with application ID
router.get(
  "/all/:application_id",
  [param("application_id").isUUID(4).withMessage("Invalid application id")],
  async (req, res) => {
    try {
      const { application_id } = req.params;
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      const superfileMonitoring = await SuperFileMonitoring.findAll({
        where: { application_id },
        attributes: { exclude: ["cluster_id"] },
        raw: true,
      });

      res.status(200).send(superfileMonitoring);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Unable to get file monitoring" });
    }
  }
);

//delete
router.delete(
  "/:superfileMonitoringId/:superfileMonitoringName",
  [
    param("superfileMonitoringId")
      .isUUID(4)
      .withMessage("Invalid superfile monitoring id"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { superfileMonitoringId, superfileMonitoringName } = req.params;
      const response = await SuperFileMonitoring.destroy({
        where: { id: superfileMonitoringId },
      });
      res
        .status(200)
        .json({ message: `Deleted ${response} superfile monitoring` });

      //Check if this job is in bree - if so - remove
      const breeJobs = jobScheduler.getAllJobs();
      const expectedJobName = `Superfile Monitoring - ${superfileMonitoringId}`;
      for (job of breeJobs) {
        if (job.name === expectedJobName) {
          jobScheduler.removeJobFromScheduler(expectedJobName);
          break;
        }
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Pause or start monitoring
router.put(
  "/superfileMonitoringStatus/:id",
  [param("id").isUUID(4).withMessage("Invalid superfile monitoring Id")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { id } = req.params;
      const monitoring = await SuperFileMonitoring.findOne({
        where: { id },
        attributes: { exclude: ["cluster_id"] },
        raw: true,
      });
      const { monitoringActive } = monitoring;

      // flipping monitoringActive
      await SuperFileMonitoring.update(
        { monitoringActive: !monitoringActive },
        { where: { id: id } }
      );

      // If monitoringActive, it is in bre - remove from bree
      if (monitoringActive) {
        await jobScheduler.removeJobFromScheduler(
          `Superfile Monitoring - ${id}`
        );
      }

      const name = monitoring.name;
      const cron = monitoring.cron;

      // If monitoringActive = false, add it to bre
      if (!monitoringActive) {
        await jobScheduler.scheduleFileMonitoringBreeJob({
          filemonitoring_id: id,
          name,
          cron,
          monitoringAssetType: "superFiles",
        });
      }

      res.status(200).send("Update successful");
    } catch (err) {
      console.log(err);
    }
  }
);

// Get individual superfile
router.get(
  "/:file_monitoring_id",
  [param("file_monitoring_id").isUUID(4).withMessage("Invalid monitoring id")],
  async (req, res) => {
    try {
      const { file_monitoring_id } = req.params;
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      const fileMonitoring = await SuperFileMonitoring.findOne({
        where: { id: file_monitoring_id },
        raw: true,
      });

      res.status(200).send(fileMonitoring);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Unable to get file monitoring" });
    }
  }
);

//update superfile monitoring
router.put(
  "/",
  [body("id").isUUID(4).withMessage("Invalid file monitoring id")],
  async (req, res) => {
    try {
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );

      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      const oldInfo = await SuperFileMonitoring.findOne({
        where: { id: req.body.id },
        raw: true,
      });

      const {
        metaData: { currentlyMonitoring },
      } = oldInfo;

      let newInfo = req.body;
      console.log(newInfo);

      let recentSubFile = await hpccUtil.getRecentSubFile(
        newInfo.cluster_id,
        newInfo.fileName
      );

      //set metaData with most recent file
      newInfo.metaData.fileInfo.mostRecentSubFile = recentSubFile.recentSubFile;
      newInfo.metaData.fileInfo.mostRecentSubFileDate = recentSubFile.recentDate
        .getTime()
        .toString();

      newInfo.metaData.fileInfo.subfileCount = recentSubFile.subfileCount;

      if (currentlyMonitoring) {
        newInfo.metaData.currentlyMonitoring = currentlyMonitoring;
      }

      const { id, name, cron, monitoringActive } = newInfo;

      await SuperFileMonitoring.update(newInfo, { where: { id } });
      res.status(200).send(newInfo);

      // If start monitoring was changed to TRUE
      if (monitoringActive && oldInfo.monitoringActive == 0) {
        const schedularOptions = {
          filemonitoring_id: id,
          name: name,
          cron: cron,
          monitoringAssetType: "superFiles",
        };
        await jobScheduler.scheduleFileMonitoringBreeJob(schedularOptions);
      }

      // If start monitoring was changed to FALSE
      if (!monitoringActive && oldInfo.monitoringActive == 1) {
        await jobScheduler.removeJobFromScheduler(
          `Superfile Monitoring - ${id}`
        );
      }

      // if cron has changed
      if (oldInfo.cron != cron) {
        const allBreeJobs = jobScheduler.getAllJobs();
        const jobName = `Superfile Monitoring - ${id}`;
        for (let job of allBreeJobs) {
          if (job.name === jobName) {
            await jobScheduler.removeJobFromScheduler(jobName);
            await jobScheduler.scheduleFileMonitoringBreeJob({
              filemonitoring_id: id,
              name: name,
              cron: cron,
              monitoringAssetType: "superFiles",
            });
          }
        }
      }
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Unable to save file monitoring details" });
    }
  }
);

module.exports = router;
