const express = require("express");
const logger = require("../../config/logger");
const router = express.Router();
const models = require("../../models");

const jobScheduler = require("../../jobSchedular/job-scheduler");
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

      //check if name already exists as directory monitoring
      const existingMonitoring = await DirectoryMonitoring.findOne({
        where: { name: newMonitoring.name },
      });

      if (existingMonitoring) {
        return res
          .status(409)
          .json({ error: "Directory monitoring name already exists" });
      }
      //always place new monitoring in pending status
      newMonitoring.approvalStatus = "Pending";
      const directoryMonitoring = await DirectoryMonitoring.create(
        newMonitoring
      );

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

      let approvalStatus = "";
      if (req.body.approved) {
        approvalStatus = "Approved";
      } else {
        approvalStatus = "Pending";
      }
      const updatedMonitoring = await directoryMonitoring.update({
        approved: req.body.approved,
        approvalStatus: approvalStatus,
        approvalNote: req.body.approvalNote,
        approvedBy: req.body.approvedBy,
        approvedAt: req.body.approvedAt,
      });

      // const { active, approved, name, cron } = updatedMonitoring;

      // // if (active && approved) {
      // //   jobScheduler.createDirectoryMonitoringBreeJob({
      // //     directoryMonitoring_id: id,
      // //     name,
      // //     cron,
      // //   });
      // // } else {
      // //   removeJob(id);
      // // }

      res.status(200).json(updatedMonitoring);
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
      resetApprovals(updates);

      //make sure name doesn't exist
      const existingMonitoring = await checkNameExists(updates.name);
      if (existingMonitoring) {
        return res
          .status(409)
          .json({ error: "Directory monitoring name already exists" });
      }

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
  "/delete/:id",
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
router.patch(
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
      // if (active && approved) {
      //   jobScheduler.createDirectoryMonitoringBreeJob({
      //     directoryMonitoring_id: id,
      //     name,
      //     cron,
      //   });
      // } else {
      //   removeJob(id);
      // }
      logger.verbose("Directory monitoring active status updated");
      res.status(200).json(directoryMonitoring);
    } catch (error) {
      logger.error(error);
      res
        .status(500)
        .json({ error: "Failed to update directory monitoring entry" });
    }
  }
);
//bulk update route to update multiple monitorings
router.put(
  "/bulkUpdate",
  [body("metaData").isArray().withMessage("Data must be array of objects")],
  async (req, res) => {
    try {
      const { metaData } = req.body;
      for (let i = 0; i < metaData.length; i++) {
        const { id, ...updates } = metaData[i];
        const directoryMonitoring = await DirectoryMonitoring.findByPk(id);
        if (!directoryMonitoring) {
          return res
            .status(404)
            .json({ error: "Directory monitoring entry not found" });
        }

        //make sure approvals are reset
        resetApprovals(updates);

        //make sure name doesn't exist
        const existingMonitoring = await checkNameExists(updates.name);
        if (existingMonitoring) {
          return res
            .status(409)
            .json({ error: "Directory monitoring name already exists" });
        }

        await directoryMonitoring.update(updates);
      }
      res.status(200).json({ message: "Directory monitorings updated" });
    } catch (error) {
      logger.error(error);
      res
        .status(500)
        .json({ error: "Failed to update directory monitoring entries" });
    }
  }
);

//bulk delete route to delete multiple monitorings
router.delete(
  "/bulkDelete",
  [body("ids").isArray().withMessage("ID's must be passed in an array")],
  async (req, res) => {
    try {
      const { ids } = req.body;

      for (let i = 0; i < ids.length; i++) {
        console.log(ids[i]);
        const directoryMonitoring = await DirectoryMonitoring.findByPk(ids[i]);
        if (!directoryMonitoring) {
          return res
            .status(404)
            .json({ error: "Directory monitoring entry not found" });
        }
        await directoryMonitoring.destroy();
        removeJob(ids[i]);
      }
      res.status(204).end();
    } catch (error) {
      logger.error(error);
      res
        .status(500)
        .json({ error: "Failed to delete directory monitoring entries" });
    }
  }
);

//bulk approve route to approve multiple monitorings
router.patch(
  "/bulkApprove",
  [
    // Add validation rules here
    body("approvalNote")
      .notEmpty()
      .isString()
      .withMessage("Approval comment must be a string")
      .isLength({ min: 4, max: 200 })
      .withMessage(
        "Approval comment must be between 4 and 200 characters long"
      ),
    body("approved").isBoolean().withMessage("Approved must be a boolean"),
    body("ids").isArray().withMessage("Invalid ids"),
    body("approvalStatus")
      .notEmpty()
      .isString()
      .withMessage("Approval Status must be a string"),
    body("approvedBy")
      .notEmpty()
      .isString()
      .withMessage("Approved by must be a string"),
    body("active").isBoolean().withMessage("Active must be a boolean"),
  ],
  async (req, res) => {
    try {
      const {
        ids,
        approved,
        approvalNote,
        approvedAt,
        approvedBy,
        approvalStatus,
        active,
      } = req.body;

      for (let i = 0; i < ids.length; i++) {
        const { id } = ids[i];
        const directoryMonitoring = await DirectoryMonitoring.findByPk(id);
        if (!directoryMonitoring) {
          return res
            .status(404)
            .json({ error: "Directory monitoring entry not found" });
        }

        await directoryMonitoring.update({
          approved: approved,
          approvalStatus: approvalStatus,
          approvalNote: approvalNote,
          approvedBy: approvedBy,
          approvedAt: approvedAt,
          active: active,
        });

        // const { name, cron } = directoryMonitoring;

        // // if (active && approved) {
        // //   jobScheduler.createDirectoryMonitoringBreeJob({
        // //     directoryMonitoring_id: id,
        // //     name,
        // //     cron,
        // //   });
        // // } else {
        // //   removeJob(id);
        // // }
      }
      res.status(200).json({ message: "Directory monitorings approved" });
    } catch (error) {
      logger.error(error);
      res
        .status(500)
        .json({ error: "Failed to approve directory monitoring entries" });
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

async function checkNameExists(name) {
  return DirectoryMonitoring.findOne({ where: { name } });
}

function resetApprovals(updates) {
  updates.approved = false;
  updates.approvalNote = null;
  updates.approvalStatus = "Pending";
  updates.approvedBy = null;
  updates.approvedAt = null;
  return updates;
}

module.exports = router;
