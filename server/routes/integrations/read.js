const models = require("../../models");
const sequelize = require("sequelize");
const integrations = models.integrations;
const integration_mapping = models.integration_mapping;
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const rootENV = path.join(process.cwd(), "..", ".env");
const serverENV = path.join(process.cwd(), ".env");
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
const { param, body, validationResult } = require("express-validator");
const validatorUtil = require("../../utils/validator");
require("dotenv").config({ path: ENVPath });
const logger = require("../../config/logger");

//Get all integrations - active or not from integrations table
router.get("/all", async (req, res) => {
  try {
    const result = await integrations.findAll();
    res.status(200).send(result);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: "Unable to get integrations" });
  }
});

// Get all active integrations from the integrations to application mapping table
router.get("/getAllActive/", async (req, res) => {
  try {
   const integrationMappingDetails = await integration_mapping.findAll(
     {
       include: [
         {
           model: integrations,
           as: "integration",
           required: true,
           attributes: ["name", "description", "metaData"],
         },
       ],
     },
     {
       raw: true,
     }
   );
    res.status(200).send(integrationMappingDetails);
  } catch (err) {
    logger.error(err);
    res.status(500).send("Failed to get active integrations: " + err);
  }
});

// Get integration details by integration relation ID
router.get("/integrationDetails/:id",
 [param("id").isUUID(4).withMessage("Invalid integration id")], 
 async (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
    const result = await integration_mapping.findOne({
      where: {
        id: req.params.id,
      },
      attributes: [
        [sequelize.col("integration_mapping.id"), "integrationMappingId"],
        [
          sequelize.col("integration_mapping.metaData"),
          "appSpecificIntegrationMetaData",
        ],
        "integration_mapping.application_id",
      ],
      include: [
        {
          model: integrations,
          as: "integration",
          required: true,
          attributes: [
            [sequelize.col("id"), "integrationId"],
            [sequelize.col("name"), "integrationName"],
            [sequelize.col("description"), "integrationDescription"],
            [sequelize.col("metaData"), "integrationMetaData"],
          ],
        },
      ],
    });
    
    res.status(200).send(result);
  } catch (err) {
    logger.error(err);
    res.status(500).send("Failed to get integration details");
  }
}
);

// Change the active status of an integration
router.post("/toggleStatus",
  [body("integrationId").isUUID(4).withMessage("Invalid integration id")],
  [body("application_id").isUUID(4).withMessage("Invalid integration id")],
  [body("active").isBoolean().withMessage("Invalid active status")],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try{
     /* 
     Intention to active 
       1. restore if soft deleted
       2. create if not exists
     Intention to deactivate
      1. destroy if exists
      */

      if (!errors.isEmpty()){
                return res
                  .status(422)
                  .json({ success: false, errors: errors.array() });
      }
      const { integrationId, application_id, active } = req.body;
      const result = await integration_mapping.findOne({
        where: {
          application_id,
          integration_id: integrationId,
        },
        paranoid: false,
      });

      if (active) {
        if (result) {
          await integration_mapping.restore(
            {
              where: {
                application_id,
                integration_id: integrationId,
              },
            }
          );
        } else {
          await integration_mapping.create({
            application_id,
            integration_id: integrationId,
          });
        }
      } else {
        await integration_mapping.destroy(
          {
            where: {
              application_id,
              integration_id: integrationId,
            },
          }
        );
      }
      res.status(200).json({message: "Integration status changed"});
    }catch(err){
      logger.error(err);
      res.status(500).json({ message: "Unable to update the integration" });
    }
  }
);

// Update the integration details (MetaData) by integration relation ID
router.put("/updateIntegrationSettings/:id",
  [param("id").isUUID(4).withMessage("Invalid integration id")],
  [body("integrationSettings").isObject().withMessage("Invalid MetaData")],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      const result = await integration_mapping.update(
        {
          metaData: req.body.integrationSettings,
        },
        {
          where: {
            id: req.params.id,
          },
        }
      );
      res.status(200).send(result);
    } catch (err) {
      logger.error(err);
      res.status(500).send("Failed to update integration details");
    }
  }
);

module.exports = router;
