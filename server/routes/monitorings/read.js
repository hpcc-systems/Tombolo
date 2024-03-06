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
    body("createdBy").notEmpty().withMessage("Created by is required")
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

module.exports = router;