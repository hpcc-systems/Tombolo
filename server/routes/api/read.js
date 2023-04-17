const express = require("express");
const models = require("../../models");
const monitoring_notifications = models.monitoring_notifications;
const apiKey = models.api_key;
const fileMonitoring = models.fileMonitoring;
const clusterMonitoring = models.clusterMonitoring;
const logger = require("../../config/logger");
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
  "/:applicationId/:name/:key",
  [
    param("applicationId").isUUID(4).withMessage("Invalid Application ID"),
    param("key").isUUID(4).withMessage("Invalid key"),
    param("name").notEmpty().trim().escape().withMessage("Invalid name"),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { applicationId: application_id } = req.params;
      if (!application_id) throw Error("Invalid app ID");

      const { name, key } = req.params;

      const validKey = await apiKey.findOne({
        where: { name },
      });

      //check if key is valid using validKey instance method of key model
      if (
        validKey &&
        !validKey.dataValues.expired &&
        (await validKey.validKey(key))
      ) {
        //check usage and expiration dates
        let metaData = validKey.dataValues.metaData;
        let currentDate = new Date().getTime();

        //Check if key is expired
        if (validKey.dataValues.expirationDate < currentDate) {
          throw Error("Key expired");
        }
        //Check if key usage is below limit
        if (metaData.Usage < metaData.UsageLimit) {
          metaData.Usage = metaData.Usage + 1;
          //update key usage
          await apiKey.update({ metaData }, { where: { name } });
        } else {
          throw Error("Key has no uses remaining");
        }

        //no errors, get notifications and return them.
        const notifications = await monitoring_notifications.findAll({
          where: { application_id },
          include: [
            {
              model: fileMonitoring,
              as: "fileMonitoring",
            },
            {
              model: clusterMonitoring,
              as: "clusterMonitoring",
            },
          ],
          raw: true,
        });

        res.status(200).send(notifications);
      } else {
        throw Error("Invalid or Expired Key");
      }
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Unable to get notifications - " + error });
    }
  }
);

module.exports = router;
