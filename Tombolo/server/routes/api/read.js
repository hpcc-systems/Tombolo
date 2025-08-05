const express = require('express');
const {
  monitoring_notifications,
  ApiKey,
  FileMonitoring,
  clusterMonitoring,
  Cluster,
} = require('../../models');
const logger = require('../../config/logger');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const rootENV = path.join(process.cwd(), '..', '.env');
const serverENV = path.join(process.cwd(), '.env');
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
const { param, validationResult } = require('express-validator');
const validatorUtil = require('../../utils/validator');

require('dotenv').config({ path: ENVPath });

router.get(
  '/:applicationId/:name/:key/notifications',
  [
    param('applicationId').isUUID(4).withMessage('Invalid Application ID'),
    param('key').isUUID(4).withMessage('Invalid key'),
    param('name').notEmpty().trim().escape().withMessage('Invalid name'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { applicationId: application_id } = req.params;
      if (!application_id) throw Error('Invalid app ID');

      const { name, key } = req.params;

      const validKey = await ApiKey.findOne({
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
          throw Error('Key expired');
        }
        //Check if key usage is below limit
        if (metaData.Usage < metaData.UsageLimit) {
          metaData.Usage = metaData.Usage + 1;
          //update key usage
          await ApiKey.update({ metaData }, { where: { name } });
        } else {
          throw Error('Key has no uses remaining');
        }

        //no errors, get notifications and return them.
        const notifications = await monitoring_notifications.findAll({
          where: { application_id },
          include: [
            {
              model: FileMonitoring,
              as: 'fileMonitoring',
            },
            {
              model: clusterMonitoring,
              as: 'clusterMonitoring',
            },
          ],
          raw: true,
        });

        return res.status(200).send(notifications);
      } else {
        throw Error('Invalid or Expired Key');
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Unable to get notifications - ' + error });
    }
  }
);

router.get(
  '/:applicationId/:name/:key/clusterusage',
  [
    param('applicationId').isUUID(4).withMessage('Invalid Application ID'),
    param('key').isUUID(4).withMessage('Invalid key'),
    param('name').notEmpty().trim().escape().withMessage('Invalid name'),
  ],
  async (req, res) => {
    try {
      //Check for errors - return if exists
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );

      // return if error(s) exist
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      const { applicationId: application_id } = req.params;
      if (!application_id) throw Error('Invalid app ID');

      const { name, key } = req.params;

      const validKey = await ApiKey.findOne({
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
          throw Error('Key expired');
        }
        //Check if key usage is below limit
        if (metaData.Usage < metaData.UsageLimit) {
          metaData.Usage = metaData.Usage + 1;
          //update key usage
          await ApiKey.update({ metaData }, { where: { name } });
        } else {
          throw Error('Key has no uses remaining');
        }

        const data = await Cluster.findAll({
          raw: true,
          attributes: ['name', 'metaData'],
        });

        res.status(200).send(data);
      }
    } catch (err) {
      logger.error(err);
      res.status(503).json({
        success: false,
        message: 'Failed to fetch current cluster usage',
      });
    }
  }
);

module.exports = router;
