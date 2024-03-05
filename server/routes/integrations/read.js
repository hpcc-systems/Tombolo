const models = require("../../models");
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
require("dotenv").config({ path: ENVPath });
const logger = require("../../config/logger");

//return all integrations active or not
router.get("/getAll", async (req, res) => {
  try {
    console.log("running");
    const result = await integrations.findAll();
    res.status(200).send(result);
  } catch (err) {
    // ... error checks
    console.log(err);
    res.status(500).send("Failed to get integrations: " + err);
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

//get all integration_mappings with application_id
router.get(
  "/getAll/:application_id",
  [param("application_id").isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      const { application_id } = req.params;
      const result = await integration_mapping.findAll({
        where: {
          application_id,
        },
      });
      res.status(200).send(result);
    } catch (err) {
      // ... error checks
      console.log(err);
      res.status(500).send("Failed to get integration mappings: " + err);
    }
  }
);

//return one integration_mapping entry with application_id and integration_id paramter
router.get(
  "/getOne/:application_id/:integration_id",
  [param("application_id").isUUID(), param("integration_id").isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      const { application_id, integration_id } = req.params;
      const result = await integration_mapping.findOne({
        where: {
          application_id,
          integration_id,
        },
      });
      res.status(200).send(result);
    } catch (err) {
      // ... error checks
      console.log(err);
      res.status(500).send("Failed to get integration mapping: " + err);
    }
  }
);

//create entry into integration_mapping table with application_id paramter
router.post(
  "/create",
  [body("application_id").isUUID(), body("integration_id").isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      const { application_id, integration_id, metaData } = req.body;
      const result = await integration_mapping.create({
        application_id,
        integration_id,
        metaData,
      });
      res.status(200).send(result);
    } catch (err) {
      // ... error checks
      console.log(err);
      res.status(500).send("Failed to create integration mapping: " + err);
    }
  }
);

//delete integration_mapping entry with application_id and integration_id paramter
router.delete(
  "/delete",
  [body("application_id").isUUID(), body("integration_id").isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      const { application_id, integration_id } = req.body;
      const result = await integration_mapping.destroy({
        where: {
          application_id,
          integration_id,
        },
      });
      res.status(200).send(result);
    } catch (err) {
      // ... error checks
      console.log(err);
      res.status(500).send("Failed to delete integration mapping: " + err);
    }
  }
);

//update integration_mapping entry with application_id and integration_id paramter
router.put(
  "/update",
  [body("application_id").isUUID(), body("integration_id").isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      const { application_id, integration_id, metaData } = req.body;
      const result = await integration_mapping.update(
        { metaData },
        {
          where: {
            application_id,
            integration_id,
          },
        }
      );
      res.status(200).send(result);
    } catch (err) {
      // ... error checks
      console.log(err);
      res.status(500).send("Failed to update integration mapping: " + err);
    }
  }
);

module.exports = router;
