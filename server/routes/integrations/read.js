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

//return all integrations
router.get("/getAll", async (res) => {
  try {
    const result = await integrations.findAll();
    res.status(200).send(result);
  } catch (err) {
    // ... error checks
    console.log(err);
  }
});

//get all integration_mappings with application_id
router.get(
  "/getAll/:application_id",
  [param("application_id").isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
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
      return res.status(400).json({ errors: errors.array() });
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
      return res.status(400).json({ errors: errors.array() });
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
      return res.status(400).json({ errors: errors.array() });
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
    }
  }
);

//update integration_mapping entry with application_id and integration_id paramter
router.put(
  "/update",
  [body("application_id").isUUID(), body("integration_id").isUUID()],
  async (req, res) => {
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
    }
  }
);

module.exports = router;
