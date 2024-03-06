const models = require("../../models");
const integrations = models.integrations;
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

router.get(
  "/get/:application_id",
  [param("application_id").isUUID(4).withMessage("Invalid application id")],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { application_id } = req.params;
      if (!application_id) throw Error("Invalid app ID");

      const result = await integrations.findAll({
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

//Get all integrations
router.get("/all", async (req, res) => {
  try {
    const result = await integrations.findAll();
    res.status(200).send(result);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: "Unable to get integrations" });
  }
});

// Get Integration By Name
router.get(
  "/byName/:name",
  [param("name").isString().withMessage("Invalid integration name")],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { name } = req.params;
      

      const result = await integrations.findOne({
        where: {
          name,
        },
      });

      res.status(200).send(result);
    } catch (err) {
     logger.error(err);
      res.status(500).json({ message: "Unable to get integration" });
    }
  }
);

//activate or deactive integration
router.put(
  "/toggle/:application_id/:name",
  [param("application_id").isUUID(4).withMessage("Invalid application id")],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { application_id, name } = req.params;

      const integration = await integrations.findOne({
        where: { application_id, name },
        raw: true,
      });

      const { active, id } = integration;

      // flipping Active
      await integrations.update({ active: !active }, { where: { id } });

      res.status(200).send("integration toggled succesfully");
    } catch (err) {
      // ... error checks
      console.log(err);
    }
  }
);


// Change the active status of an integration
router.patch(
  "/:integrationId",
  [param("integrationId").isUUID(4).withMessage("Invalid integration id")],
  [body("active").isBoolean().withMessage("Invalid active status")],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }
      const { integrationId } = req.params;
      const { active } = req.body;

      const updatedRowCount = await integrations.update(
        { active }, // new values
        { where: { id: integrationId } } // where to apply the update
      );

      const message =
        updatedRowCount === 1
          ? `Integration status changed to ${active}`
          : "Integration not found";

      res.status(200).json({ message });
    } catch (err) {
      logger.error(err);
      res.status(500).json({ message: "Unable to update the integration" });
    }
  }
);

//update integration notifications
router.put(
  "/update/:application_id/:name",
  [param("application_id").isUUID(4).withMessage("Invalid application id")],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { application_id, name } = req.params;

      if (!application_id) throw Error("Invalid app ID");
      const oldintegration = await integrations.findOne({
        where: { application_id, name },
        raw: true,
      });

      const { id } = oldintegration;

      console.log(req.body);

      // adjusting
      await integrations.update(
        { metaData: req.body.notifications, config: req.body.active },
        { where: { id } }
      );

      res.status(200).send("integration updated succesfully");
    } catch (err) {
      // ... error checks
      console.log(err);
    }
  }
);

module.exports = router;
