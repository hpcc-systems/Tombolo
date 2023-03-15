const models = require('../../models');
const express = require('express');
const logger = require('../../config/logger');
const validatorUtil = require("../../utils/validator");
const { body, param, validationResult } = require("express-validator");
const hpccJSComms = require("@hpcc-js/comms");
const hpccUtil = require("../../utils/hpcc-util");
const JobScheduler = require("../../job-scheduler");

const ClusterMonitoring = models.clusterMonitoring;
const router = express.Router();

// Create Cluster Monitoring
router.post(
  "/",
  [
    //Validation middleware
    body("name").isString().withMessage("Invalid cluster monitoring name"),
    body("application_id").isUUID(4).withMessage("Invalid application id"),
    body("cluster_id").isUUID(4).withMessage("Invalid cluster id"),
    body("cron").custom((value) => {
      const valArray = value.split(" ");
      if (valArray.length > 5) {
        throw new Error(
          `Expected number of cron parts 5, received ${valArray.length}`
        );
      } else {
        return Promise.resolve("Good to go");
      }
    }),
    body("isActive").isBoolean().withMessage("Invalid is active flag"),
    body("metaData")
      .isObject()
      .withMessage("Invalid cluster monitoring meta data"),
  ],
  async (req, res) => {
    try {
      //Check for errors - return if exists
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );

      if (!errors.isEmpty()) {
        logger.verbose(errors);
        return res.status(422).json({ success: false, errors: errors.array() });
      }

      //create
      const clusterMonitoring = await ClusterMonitoring.create(req.body);
      res.status(200).send(clusterMonitoring);

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
      res.status(503).send({ success: false, message: "Failed to fetch" });
    }
  }
);

// Get all cluster monitoring
router.get("/all/:application_id", [
    param("application_id").isUUID().withMessage("Invalid application ID")
], async(req, res) =>{
    try{
      //Check for errors - return if exists
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );

      // return if error(s) exist
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
     
      const { application_id } = req.params;
      const clusterMonitorings = await ClusterMonitoring.findAll({where: {application_id}, raw: true});

      res.status(200).send(clusterMonitorings)
    }catch(err){
        logger.error(err);
        res.send(503).send({success: false, message: "Failed to fetch"})
    }
})

// Get one cluster monitoring
router.get("/:id", [
    param("id").isUUID(4).withMessage("Invalid cluster monitoring ID")
], async(req, res) =>{
    try{
      //Check for errors - return if exists
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );

      // return if error(s) exist
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
    
      const {id} = req.params;
      const clusterMonitoring = await ClusterMonitoring.findOne({where: {id}, raw: true});
      res.status(200).send(clusterMonitoring);

    }catch(err){
        logger.error(err);
        res.status(503).send({success: false, message: "Failed to fetch"})
    }
})

//Delete
router.delete(
  "/:id",
  [param("id").isUUID(4).withMessage("Invalid cluster monitoring ID")],
  async (req, res) => {
    try {
      //Check for errors - return if exists
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );

      // return if error(s) exist
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      const { id } = req.params;
      const deleted = await ClusterMonitoring.destroy({
        where: { id },
      });

      res.status(200).send({deleted});
    } catch (err) {
      logger.error(err);
      res.status(503).json({success: false, message: "Failed to delete"});
    }
  }
);

// Pause or start monitoring
router.put(
  "/clusterMonitoringStatus/:id",
  [param("id").isUUID(4).withMessage("Invalid file monitoring Id")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
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

      res.status(200).send("Update successful");
    } catch (err) {
      logger.error(err);
    }
  }
);

// Update Monitoring 
router.put(
  "/",
  [
    body("id").isUUID().withMessage("Invalid Cluster monitoring ID"),
    body("name").isString().withMessage("Invalid cluster monitoring name"),
    body("application_id").isUUID(4).withMessage("Invalid application id"),
    body("cluster_id").isUUID(4).withMessage("Invalid cluster id"),
    body("cron").custom(value =>{
      const valArray = value.split(" ");
      if(valArray.length > 5){
        throw new Error(
          `Expected number of cron parts 5, received ${valArray.length}`
        );
      }else{
        return Promise.resolve("Good to go")
      }
      
    }),
    body("isActive").isBoolean().withMessage("Invalid is active flag"),
    body("metaData")
      .isObject()
      .withMessage("Invalid cluster monitoring meta data"),
  ],
  async (req, res) => {
    try {
      //Check for errors - return if exists
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );

      // return if error(s) exist
      if (!errors.isEmpty()) {
        logger.error(errors);
        return res.status(422).json({ success: false, errors: errors.array() });
      }

      //Existing cluster monitoring details
      let {id,isActive,cron } = req.body;

      const existingMonitoringDetails = await ClusterMonitoring.findOne({
        where: { id },
      });
      const {metaData: {last_monitored}} = existingMonitoringDetails;

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
          (job) => job.name === monitoringUniqueName
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
      res.status(503).json({success: false, message : "Failed to update"});
    }
  }
);

// Get cluster monitoring engines 
router.get(
  "/clusterEngines/:cluster_id",
  [param("cluster_id").isUUID().withMessage("Invalid cluster ID")],
  async (req, res) => {
    try {
      //Check for errors - return if exists
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );

      // return if error(s) exist
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      const { cluster_id } = req.params;
      let cluster = await hpccUtil.getCluster(cluster_id);
      const { thor_host, thor_port, username, hash } = cluster;
      const clusterDetails = {
        baseUrl: `${thor_host}:${thor_port}`,
        userID: username || "",
        password: hash || "",
      };
      const topologyService = new hpccJSComms.TopologyService(clusterDetails);
      const clusterEngines = await topologyService.TpListTargetClusters();
      res.status(200).send(clusterEngines);
    } catch (err) {
      logger.error(err);
      res.status(503).json({success: false, message : "Failed to get engines"});
    }
  }
);

// Get target cluster usage
router.get("/targetClusterUsage/:cluster_id",[
    param("cluster_id").isUUID().withMessage("Invalid cluster ID"),
    body("engines").isArray().withMessage("Invalid engines")
], async (req, res) => {
  try {
    //Check for errors - return if exists
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );

    // return if error(s) exist
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });
    
    const { cluster_id } = req.params;
    const {engines} = req.body;

    let cluster = await hpccUtil.getCluster(cluster_id);
    const { thor_host, thor_port, username, hash } = cluster;
    const clusterDetails = {
      baseUrl: `${thor_host}:${thor_port}`,
      userID: username || "",
      password: hash || "",
    };
    const machineService = new hpccJSComms.MachineService(clusterDetails);

    const targetClusterUsage = await machineService.GetTargetClusterUsageEx(engines);
    const clusterUsage = [];
    targetClusterUsage.forEach(function (details) {
      clusterUsage.push({
        engine: details.Name,
        size: details.max
      })
    });
        
    res.status(200).send(clusterUsage);
  } catch (err) {
    logger.error(err);
    res.status(503).json({success: false, message : "Failed to get cluster usage"});
  }
});

module.exports = router;
