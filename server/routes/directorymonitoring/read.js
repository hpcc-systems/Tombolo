const express = require("express");
const logger = require("../../config/logger");
const router = express.Router();
const models = require("../../models");
const jobScheduler = require("../../job-scheduler");
const DirectoryMonitoring = models.directoryMonitoring;
const validatorUtil = require("../../utils/validator");
const { body, param, validationResult } = require("express-validator");

//create one
router.post(
  "/",
  [
    body("application_id")
      .isUUID()
      .withMessage("Application ID must be a valid UUID"),
    body("name").notEmpty().withMessage("Monitoring name is required"),
    body("directory").notEmpty().withMessage("directory is required"),
    body("cluster_id").isUUID().withMessage("Cluster ID must be a valid UUID"),
    body("active").isBoolean().withMessage("Active must be a boolean"),
    body("approved").isBoolean().withMessage("Approved must be a boolean"),
    body("metaData")
      .isObject()
      .withMessage("Meta data must be an object if provided"),
    body("createdBy").notEmpty().withMessage("Created by is required"),
    body("updatedBy").notEmpty().withMessage("Last updated by is required"),
  ],
  async (req, res) => {
    try {
      // Validate the req.body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({ errors: errors.array() });
      }
      const newMonitoring = req.body;
      const directoryMonitoring = await DirectoryMonitoring.create(
        newMonitoring
      );

      const { id, name, cron, active } = directoryMonitoring;

      if (active) {
        jobScheduler.createDirectoryMonitoringBreeJob({
          directoryMonitoring_id: id,
          name,
          cron,
        });
      }

      res.status(201).json(directoryMonitoring);
    } catch (error) {
      logger.error(error);
      res.status(500).json({
        error: "Failed to create directory monitoring entry: " + error.message,
      });
    }
  }
);

//aprove or reject one
router.put(
  "/:id/approve",
  [
    param("id").isUUID().withMessage("Application ID must be a valid UUID"),
    body("approved").isBoolean().withMessage("Approved must be a boolean"),
    body("approvalNote")
      .optional()
      .isString()
      .withMessage("Approval note must be a string"),
    body("approvedBy").isString().withMessage("Approved by is required"),
    body("approvedAt").notEmpty().withMessage("Approved at is required"),
  ],
  async (req, res) => {
    try {
      // Validate the req.body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({ errors: errors.array() });
      }
      const { id } = req.body;
      const directoryMonitoring = await DirectoryMonitoring.findByPk(id);
      if (!directoryMonitoring) {
        return res
          .status(404)
          .json({ error: "Directory monitoring entry not found" });
      }
      const updatedMonitoring = await directoryMonitoring.update({
        approved: req.body.approved,
        approvalNote: req.body.approvalNote,
        approvedBy: req.body.approvedBy,
        approvedAt: req.body.approvedAt,
      });

      const { active, approved, name, cron } = updatedMonitoring;

      if (active && approved) {
        jobScheduler.createDirectoryMonitoringBreeJob({
          directoryMonitoring_id: id,
          name,
          cron,
        });
      } else {
        removeJob(id);
      }

      res.status(200).json(directoryMonitoring);
    } catch (error) {
      logger.error(error);
      res
        .status(500)
        .json({ error: "Failed to approve directory monitoring entry" });
    }
  }
);

// Update an existing directory monitoring entry
router.put(
  "/:id/update",
  [
    param("id").isUUID().withMessage("Application ID must be a valid UUID"),
    body("updatedBy").notEmpty().withMessage("Updated by is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({ errors: errors.array() });
      }
      const updates = req.body;
      const { id } = req.params;

      const directoryMonitoring = await DirectoryMonitoring.findByPk(id);
      if (!directoryMonitoring) {
        return res
          .status(404)
          .json({ error: "Directory monitoring entry not found" });
      }
      //make sure approvals are reset

      updates.approved = false;
      updates.approvalNote = null;
      updates.approvedBy = null;
      updates.approvedAt = null;

      await directoryMonitoring.update(updates);

      //make sure and remove job if it is updated
      removeJob(id);

      res.status(200).json(directoryMonitoring);
    } catch (error) {
      logger.error(error);
      res
        .status(500)
        .json({ error: "Failed to update directory monitoring entry" });
    }
  }
);

// Delete a directory monitoring entry
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("ID must be a UUID")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({ errors: errors.array() });
      }
      const { id } = req.params;
      const directoryMonitoring = await DirectoryMonitoring.findByPk(id);

      if (!directoryMonitoring) {
        return res
          .status(404)
          .json({ error: "Directory monitoring entry not found" });
      }

      await directoryMonitoring.destroy();

      //remove the job
      removeJob(id);

      res.status(204).end();
    } catch (error) {
      logger.error(error);
      res
        .status(500)
        .json({ error: "Failed to delete directory monitoring entry" });
    }
  }
);

//get one
router.get(
  "/:id",
  [param("id").isUUID().withMessage("ID must be a UUID")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({ errors: errors.array() });
      }
      const { id } = req.params;
      const directoryMonitoring = await DirectoryMonitoring.findByPk(id);
      if (!directoryMonitoring) {
        return res
          .status(404)
          .json({ error: "Directory monitoring entry not found" });
      }
      res.status(200).json(directoryMonitoring);
    } catch (error) {
      logger.error(error);
      res
        .status(500)
        .json({ error: "Failed to get directory monitoring entry" });
    }
  }
);

//get all
router.get(
  "/all/:applicationId",
  [
    param("applicationId")
      .isUUID()
      .withMessage("Application ID must be a valid UUID"),
  ],
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      const directoryMonitorings = await DirectoryMonitoring.findAll({
        where: { application_id: applicationId },
        raw: true,
      });

      res.status(200).send(directoryMonitorings);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ message: "Unable to get directory monitoring" });
    }
  }
);

//pause or start monitoring with active boolean
router.put(
  "/:id/active",
  [param("id").isUUID().withMessage("ID must be a UUID")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({ errors: errors.array() });
      }
      const { id } = req.params;
      const directoryMonitoring = await DirectoryMonitoring.findByPk(id);
      if (!directoryMonitoring) {
        return res
          .status(404)
          .json({ error: "Directory monitoring entry not found" });
      }

      const { active, approved, name, cron } = directoryMonitoring;
      await directoryMonitoring.update({ active: !active });

      // location for starting or stopping monitoring job
      if (active && approved) {
        jobScheduler.createDirectoryMonitoringBreeJob({
          directoryMonitoring_id: id,
          name,
          cron,
        });
      } else {
        removeJob(id);
      }

      res.status(200).json(directoryMonitoring);
    } catch (error) {
      logger.error(error);
      res
        .status(500)
        .json({ error: "Failed to update directory monitoring entry" });
    }
  }
);

function removeJob(id) {
  const breeJobs = jobScheduler.getAllJobs();
  const expectedJobName = `Directory Monitoring - ${id}`;
  for (job of breeJobs) {
    if (job.name === expectedJobName) {
      jobScheduler.removeJobFromScheduler(expectedJobName);
      break;
    }
  }
}

module.exports = router;
