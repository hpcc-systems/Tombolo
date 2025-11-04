const express = require('express');
const {
  MonitoringNotification,
  ApiKey,
  FileMonitoring,
  clusterMonitoring,
  Cluster,
} = require('../../models');
const logger = require('../../config/logger');
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require('../../utils/response');
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
      if (!errors.isEmpty()) return sendValidationError(res, errors.array());
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
          return sendError(res, 'Key expired', 401);
        }
        //Check if key usage is below limit
        if (metaData.Usage < metaData.UsageLimit) {
          metaData.Usage = metaData.Usage + 1;
          //update key usage
          await ApiKey.update({ metaData }, { where: { name } });
        } else {
          return sendError(res, 'Key has no uses remaining', 429);
        }

        //no errors, get notifications and return them.
        const notifications = await MonitoringNotification.findAll({
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

        return sendSuccess(res, notifications);
      } else {
        return sendError(res, 'Invalid or Expired Key', 401);
      }
    } catch (error) {
      logger.error('Get notifications API error:', error);
      return sendError(res, `Unable to get notifications - ${error.message}`);
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
      if (!errors.isEmpty()) return sendValidationError(res, errors.array());

      const { applicationId: application_id } = req.params;
      if (!application_id) return sendError(res, 'Invalid app ID', 400);

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
          return sendError(res, 'Key expired', 401);
        }
        //Check if key usage is below limit
        if (metaData.Usage < metaData.UsageLimit) {
          metaData.Usage = metaData.Usage + 1;
          //update key usage
          await ApiKey.update({ metaData }, { where: { name } });
        } else {
          return sendError(res, 'Key has no uses remaining', 429);
        }

        const data = await Cluster.findAll({
          raw: true,
          attributes: ['name', 'metaData'],
        });

        return sendSuccess(res, data);
      } else {
        return sendError(res, 'Invalid or Expired Key', 401);
      }
    } catch (err) {
      logger.error('getClusterUsage: ', err);
      return sendError(res, 'Failed to fetch current cluster usage', 503);
    }
  }
);

module.exports = router;
