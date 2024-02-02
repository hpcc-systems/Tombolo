const models = require("../../models");
const integrations = models.integrations;
let application = models.application;
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const rootENV = path.join(process.cwd(), "..", ".env");
const serverENV = path.join(process.cwd(), ".env");
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
const { param, validationResult } = require("express-validator");
const validatorUtil = require("../../utils/validator");
require("dotenv").config({ path: ENVPath });

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
