const express = require("express");
const router = express.Router();
const { body, check, param } = require("express-validator");

//Local imports
const logger = require("../../config/logger");
const models = require("../../models");
const { validationResult } = require("express-validator");

//Constants
const JobMonitoring = models.jobMonitoring;

// Create new job monitoring
router.post(
  "/",
  [
    body("monitoringName")
      .notEmpty()
      .withMessage("Monitoring name is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("monitoringScope")
      .notEmpty()
      .withMessage("Monitoring scope is required"),
    body("clusterId").isUUID().withMessage("Cluster ID must be a valid UUID"),
    // body("isActive").isBoolean().withMessage("isActive must be a boolean"),
    body("jobName").notEmpty().withMessage("Job name is required"),
    body("applicationId")
      .isUUID()
      .withMessage("Application ID must be a valid UUID"),
    body("metaData")
      .isObject()
      .withMessage("Meta data must be an object if provided"),
    body("createdBy").notEmpty().withMessage("Created by is required"),
    body("lastUpdatedBy").notEmpty().withMessage("Last updated by is required"),
  ],
  async (req, res) => {
    // Handle the POST request here
    try {
      // Validate the req.body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.log(errors);
        return res.status(422).json({ errors: errors.array() });
      }

      //Save the job monitoring
      const response = await JobMonitoring.create(
        { ...req.body, approvalStatus: "Pending" },
        { raw: true }
      );
      res.status(200).send(response);
    } catch (err) {
      logger.error(err);
      res.status(500).send("Failed to save job monitoring");
    }
  }
);

// Get all Job monitorings
router.get(
  "/all/:applicationId",
  [
    param("applicationId")
      .isUUID()
      .withMessage("Application ID must be a valid UUID"),
  ],
  async (req, res) => {
    try {
      // Validate the application ID
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.error(errors);
        return res.status(400).json({ errors: errors.array() });
      }
      
      const jobMonitorings = await JobMonitoring.findAll({
        where: { applicationId: req.params.applicationId },
        order: [["createdAt", "DESC"]],
      });
      res.status(200).json(jobMonitorings);
    } catch (err) {
      logger.error(err);
      res.status(500).send("Failed to get job monitorings");
    }
  }
);

// Get a single job monitoring
router.get("/:id", async (req, res) => {
  try {
    const jobMonitoring = await JobMonitoring.findByPk(req.params.id);
    res.status(200).json(jobMonitoring);
  } catch (err) {
    logger.error(err);
    res.status(500).send("Failed to get job monitoring");
  }
});

// Patch a single job monitoring
router.patch(
  "/",
  [
    body("id").isUUID().withMessage("ID must be a valid UUID"),
    body("monitoringName")
      .isString()
      .withMessage("Monitoring name must be type string"),
    body("description").isString().withMessage("Description must be string"),
    body("monitoringScope").isString().withMessage("Monitoring must be string"),
    body("clusterId").isUUID().withMessage("Cluster ID must be a valid UUID"),
    body("jobName").isString().withMessage("Job name is required"),
    body("applicationId")
      .isUUID()
      .withMessage("Application ID must be a valid UUID"),
    body("metaData")
      .isObject()
      .withMessage("Meta data must be an object if provided"),
    body("createdBy")
      .optional()
      .isString()
      .withMessage("Created by must be an object if provided"),
    body("lastUpdatedBy").isString().withMessage("Last updated by is required"),
  ],
  async (req, res) => {
    try {
      // Validate the req.body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.error(errors);
        return res.status(400).json({ errors: errors.array() });
      }

      //Payload
      const payload = req.body;
      payload.approvalStatus = "Pending";
      payload.approverComment = null;
      payload.approvedBy = null;
      payload.approvedAt = null;
      payload.isActive = false;

      //Update the job monitoring
      const updatedRows = await JobMonitoring.update(req.body, {
        where: { id: req.body.id },
        returning: true,
      });

      //If no rows were updated, then the job monitoring does not exist
      if (updatedRows[0] === 0) {
        return res.status(404).send("Job monitoring not found");
      }

      //If updated - Get the updated job monitoring
      const updatedJob = await JobMonitoring.findByPk(req.body.id);
      res.status(200).send(updatedJob);
    } catch (err) {
      console.log(err);
      logger.error(err);
      res.status(500).send("Failed to update job monitoring");
    }
  }
);

// Reject or approve monitoring
router.patch(
  "/evaluate",
  [
    // Add validation rules here
    body("approverComment")
      .notEmpty()
      .isString()
      .withMessage("Approval comment must be a string")
      .isLength({ min: 4, max: 200 })
      .withMessage(
        "Approval comment must be between 4 and 200 characters long"
      ),
    body("id").isUUID().withMessage("Invalid id"),
    body("approvalStatus")
      .notEmpty()
      .isString()
      .withMessage("Accepted must be a string"),
    body("approvedBy")
      .notEmpty()
      .isString()
      .withMessage("Approved by must be a string"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(503).send("Failed save your evaluation");
    }

    try {
      const { id, approverComment, approvalStatus, approvedBy } = req.body;
      let isActive = false;
      if (approvalStatus === "Approved") {
        toggleActive = true;
      }
      await JobMonitoring.update(
        { approvalStatus, approverComment, approvedBy, approvedAt: new Date(), isActive },
        { where: { id } }
      );
      res.status(200).send("Successfully saved your evaluation");
    } catch (err) {
      logger.error(err);
      res.status(500).send("Failed to evaluate job monitoring");
    }
  }
);

// Bulk delete
router.delete(
  "/bulkDelete",
  [
    body("ids").isArray().withMessage("IDs must be an array"),
    body("ids.*").isUUID().withMessage("Invalid id"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(503).send("Failed to delete");
    }

    try {
      const response = await JobMonitoring.destroy({ where: { id: req.body.ids } });
      res.status(200).json(response);
    } catch (err) {
      logger.error(err);
      res.status(500).send("Failed to delete job monitoring");
    }
  }
);

//Delete a single job monitoring
router.delete(
  "/:id",
  [check("id", "Invalid id").isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(503).send("Failed to delete");
    }

    try {
      await JobMonitoring.destroy({ where: { id: req.params.id } });
      res.status(200).send("success");
    } catch (err) {
      logger.error(err);
      res.status(500).send("Failed to delete job monitoring");
    }
  }
);

// Toggle job monitoring
router.patch(
  "/toggleIsActive",
  [
    body("id").isUUID().withMessage("ID must be a valid UUID"),
  ],
  async (req, res) => {

    // Handle the PATCH request here
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(503).send("Failed to toggle");
    }

    try {
      const { id } = req.body;
      // Get and toggle
      const jobMonitoring = await JobMonitoring.findByPk(id);
      if (!jobMonitoring) {
        logger.error("Toggle Job monitoring - Job monitoring not found");
        return res.status(404).send("Job monitoring not found");
      }
      const isApproved = jobMonitoring.approvalStatus === "Approved";
      if (!isApproved) {
        logger.error("Toggle Job monitoring - Job monitoring not approved");
        return res.status(503).send("Can't toggle job monitoring that is not in approved state");
      }
      const currentStatus = jobMonitoring.isActive;
      const data = await jobMonitoring.update({ isActive: !currentStatus });

      res.status(200).send(data);
    } catch (err) {
      logger.error(err);
      res.status(500).send("Failed to toggle job monitoring");
    }
  }
);

// Bulk update - only primary, secondary and notify contact are part of bulk update for now
router.patch(
  "/bulkUpdate",
  [
    body("metaData").isArray().withMessage("Data must be array of objects"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(errors);
      return res.status(503).send("Failed to update");
    }

    try {

      const {metaData: payload} = req.body;

      for(const data of payload){
        await JobMonitoring.update({
          metaData: data.metaData,
        },{
          where: {id: data.id}
        });
      }

      res.status(200).json({success: true, message: "Successfully updated job monitorings"});
     
    } catch (err) {
      logger.error(err);
      res.status(500).send("Failed to update job monitoring");
    }
  }
);




// Export the router
module.exports = router;
