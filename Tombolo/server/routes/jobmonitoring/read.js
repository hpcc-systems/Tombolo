const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const { body, check, param } = require("express-validator");

//Local imports
const logger = require("../../config/logger");
const models = require("../../models");
const { validationResult } = require("express-validator");
const JobScheduler = require("../../jobSchedular/job-scheduler");

//Constants
const JobMonitoring = models.jobMonitoring;
const jobMonitoring_Data = models.jobMonitoring_Data;
const Op = Sequelize.Op;

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

      // If TimeSeriesAnalysis is part of the notification condition, create a job to fetch WU info (Runs in background)
      const {metaData: {notificationMetaData: { notificationCondition }}} = req.body;

      if (notificationCondition.includes("TimeSeriesAnalysis")) {
        JobScheduler.createWuInfoFetchingJob({
          clusterId: req.body.clusterId,
          jobName: req.body.jobName,
          monitoringId: response.id,
          applicationId: req.body.applicationId,
        });
      }

      res.status(200).send(response);
    } catch (err) {
      logger.error(err.message);
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

      // Get existing monitoring
      const existingMonitoring = await JobMonitoring.findByPk(req.body.id);
      if (!existingMonitoring) {
        return res.status(404).send("Job monitoring not found");
      }

      const { clusterId: existingClusterId, jobName: existingJobName } =
        existingMonitoring;
      const clusterIdIsDifferent = req.body.clusterId !== existingClusterId;
      const jobNameIsDifferent = req.body.jobName !== existingJobName;

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

      // If the clusterId or jobName has changed, update the jobMonitoring_Data table ( Happens in background)
      const { metaData: { notificationMetaData: { notificationCondition }  }} = req.body;

      if (
        (clusterIdIsDifferent || jobNameIsDifferent) &&
        notificationCondition.includes("TimeSeriesAnalysis")
      ) {
        JobScheduler.createWuInfoFetchingJob({
          clusterId: req.body.clusterId,
          jobName: req.body.jobName,
          monitoringId: req.body.id,
          applicationId: req.body.applicationId,
        });
      }

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
    body("ids")
    .isArray()
    .withMessage("IDs must be an array"),
    body("ids.*")
      .isUUID()
      .withMessage("Invalid id"),
    body("approvalStatus")
      .notEmpty()
      .isString()
      .withMessage("Accepted must be a string"),
    body("isActive")
      .isBoolean()
      .withMessage("isActive must be a boolean"),
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
      const { ids, approverComment, approvalStatus, approvedBy, isActive } = req.body;
      await JobMonitoring.update(
        {
          approvalStatus,
          approverComment,
          approvedBy,
          approvedAt: new Date(),
          isActive,
        },
        { where: { id: { [Op.in]: ids } } }
      );
      res.status(200).send("Successfully saved your evaluation");
    } catch (err) {
      logger.error(err.message);
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
    body("ids").isArray().withMessage("Invalid ids"), // Ensure ids is an array
    body("ids.*").isUUID().withMessage("Invalid id"), // Ensure each id is a valid UUID
    // make action optional and when provided must be either start or pause
    body("action")
      .optional()
      .isIn(["start", "pause"])
      .withMessage("Action must be either start or pause"),
  ],
  async (req, res) => {
    // Handle the PATCH request here
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send("Failed to toggle"); // Use a valid status code
    }

    let transaction;

    try {
      transaction = await JobMonitoring.sequelize.transaction();
      const { ids, action } = req.body; // Expecting an array of IDs

      // Find all job monitorings with the given IDs
      const jobMonitorings = await JobMonitoring.findAll({
        where: { id: { [Op.in]: ids } },
      });

      if (jobMonitorings.length === 0) {
        logger.error("Toggle Job monitoring - Job monitorings not found");
        return res.status(404).send("Job monitorings not found");
      }

      // Filter out the job monitorings that are not approved
      const approvedJobMonitorings = jobMonitorings.filter(
        (jobMonitoring) => jobMonitoring.approvalStatus === "Approved"
      );

      if (approvedJobMonitorings.length === 0) {
        logger.error(
          "Toggle Job monitoring - No approved job monitorings found"
        );
        return res.status(400).send("No approved job monitorings to toggle"); // Use a valid status code
      }

      // Get the IDs of the approved job monitorings
      const approvedIds = approvedJobMonitorings.map(
        (jobMonitoring) => jobMonitoring.id
      );

      if(action){
        // If action is start or pause change isActive to true or false respectively
        await JobMonitoring.update(
          { isActive: action === "start" },
          {
            where: { id: { [Op.in]: approvedIds } },
            transaction,
          }
        );
      }else{
      // Toggle the isActive status for all approved job monitorings
      await JobMonitoring.update(
        { isActive: Sequelize.literal("NOT isActive") },
        {
          where: { id: { [Op.in]: approvedIds } },
          transaction,
        }
      );
    }
  
      await transaction.commit();

      // Get all updated job monitorings
      const updatedJobMonitorings = await JobMonitoring.findAll({
        where: { id: { [Op.in]: approvedIds } },
      });

      res.status(200).send({ success: true, message: "Toggled successfully",  updatedJobMonitorings }); // Send the updated job monitorings
    } catch (err) {
      await transaction.rollback();
      logger.error(err.message);
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
          isActive: false,
          approvalStatus: "Pending",
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

// Get Job Monitoring Data by JM ID
router.get(
  "/data/:id",
  [param("id").isUUID().withMessage("ID must be a valid UUID")],
  async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(errors);
      return res.status(503).send("Failed to get job monitoring data");
    }

    try {
      const jobMonitoringData = await jobMonitoring_Data.findAll({
        where: { monitoringId: id },
        // latest ones first
        order: [["createdAt", "DESC"]],
        attributes: [ "wuTopLevelInfo"],
        raw: true
      });

      const topLevelInfo = jobMonitoringData.map(data => JSON.parse(data.wuTopLevelInfo));
  
      topLevelInfo.forEach(i =>{
        i.sequenceNumber = parseInt(i.Wuid.replace(/W|-/g, ""), 10);
      })

      // sort by sequence number
      const sortedTopLevelInfo = topLevelInfo.sort((a, b) => b.sequenceNumber - a.sequenceNumber);
      res.status(200).json(sortedTopLevelInfo);
    } catch (err) {
      logger.error(err.message);
      res.status(500).send("Failed to get job monitoring data");
    }
  }
);
// Export the router
module.exports = router;
