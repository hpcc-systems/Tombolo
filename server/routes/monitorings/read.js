const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");


//Local Imports
const models = require("../../models");
const logger = require("../../config/logger");

// Constants
const MonitoringTypes = models.monitoring_types;

// Route to get all monitoring types
router.get("/", async(req, res) => {
    try{
        const monitoringTypes = await MonitoringTypes.findAll();
        res.status(200).json(monitoringTypes);
    }catch(err){
        logger.error(err);
        res.status(500).json({message: 'Failed to fetch monitoring types'});
    }
});

// Note - this route is for testing only . Monitoring types should be seeded in the database
// Route to post a new monitoring type
router.post("/",
[
    body("name").notEmpty().withMessage("Monitoring type name is required"),
    body("createdBy").optional().isObject().withMessage("Created by is required")
],
async(req, res) => {
    try{
        // Validate the request
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            logger.error(errors.array());
            return res.status(400).json({message: "Failed to save monitoring type"});
        }
        const monitoringType = await MonitoringTypes.create(req.body);
        res.status(200).json(monitoringType);
    }catch(error){
        logger.error(error);
        res.status(500).json({message: 'Failed to create monitoring type'});
    }
});


// Delete a monitoring type
router.delete("/:id", async(req, res) => {
    try{
        const monitoringType = await MonitoringTypes.findByPk(req.params.id);
        if(!monitoringType){
            return res.status(404).json({message: 'Monitoring type not found'});
        }
        await monitoringType.destroy();
        res.status(200).json({message: 'Monitoring type deleted successfully'});
    }catch(error){
        logger.error(error);
        res.status(500).json({message: 'Failed to delete monitoring type'});
    }
});

// update a monitoring type
router.put("/:id",
[
    body("name").notEmpty().withMessage("Monitoring type name is required"),
    body("updatedBy").notEmpty().withMessage("Updated by is required")
],
async(req, res) => {
    try{
        // Validate the request
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            logger.error(errors.array());
            return res.status(400).json({message: "Failed to update monitoring type"});
        }
        const monitoringType = await MonitoringTypes.findByPk(req.params.id);
        if(!monitoringType){
            return res.status(404).json({message: 'Monitoring type not found'});
        }
        await monitoringType.update(req.body);
        res.status(200).json(monitoringType);
    }catch(error){
        logger.error(error);
        res.status(500).json({message: 'Failed to update monitoring type'});
    }
}
);

// Get monitoring type id by name, name is in the request body as monitoringTypeName
router.get("/getMonitoringTypeId/:monitoringTypeName", async (req, res) => {
  try {
    const monitoringType = await MonitoringTypes.findOne({
      where: {
        name: req.params.monitoringTypeName,
      },
    });
    if (!monitoringType) {
      return res.status(404).json({ message: "Monitoring type not found" });
    }
    res.status(200).json(monitoringType.id);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Failed to get monitoring type id" });
  }
});

module.exports = router;