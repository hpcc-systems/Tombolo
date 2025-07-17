const express = require('express');
const logger = require('../../config/logger');
const router = express.Router();
const { api_key: apiKey } = require('../../models');
const { v4: uuidv4 } = require('uuid');
const validatorUtil = require('../../utils/validator');
const { param, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const rootENV = path.join(process.cwd(), '..', '.env');
const serverENV = path.join(process.cwd(), '.env');
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
require('dotenv').config({ path: ENVPath });

router.post(
  '/newKey/:application_id',
  [param('application_id').isUUID(4).withMessage('Invalid application id')],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      //28 day default if not set, max of 365
      let duration = process.env.API_KEY_DURATION || 28;

      if (duration > 365) {
        duration = 365;
      }
      const application_id = req.body.applicationId;

      const { Name, Notes, emails } = req.body.formData.formData;

      const metaData = {
        Notes: Notes,
        Usage: 0,
        UsageLimit: 1000 * duration,
        emails,
      };

      //get epoch timestamp
      let expirationDate = new Date().getTime();

      //add duration
      expirationDate += duration * 86400000;

      const key = uuidv4();

      const newKey = await apiKey.create({
        apiKey: key,
        metaData,
        name: Name,
        application_id,
        expirationDate,
      });

      newKey.apiKey = key;
      return res.status(200).send(newKey);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ message: 'Unable to generate new key' });
    }
  }
);

// Get all keys
router.get(
  '/all/:application_id',
  [param('application_id').isUUID(4).withMessage('Invalid application id')],
  async (req, res) => {
    try {
      const { application_id } = req.params;

      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );

      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      const keys = await apiKey.findAll({
        where: { application_id },
        attributes: { exclude: ['apiKey'] },
        raw: true,
      });

      return res.status(200).send(keys);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ message: 'Unable to fetch keys' });
    }
  }
);

//delete
router.delete(
  '/:id',
  [param('id').isUUID(4).withMessage('Invalid api key')],
  async (req, res) => {
    try {
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const id = req.params.id;
      const response = await apiKey.destroy({
        where: { id: id },
      });

      return res.status(200).json({ message: `Deleted ${response} api key` });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
