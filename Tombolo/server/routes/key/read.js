const express = require('express');
const logger = require('../../config/logger');
const router = express.Router();
const { ApiKey } = require('../../models');
const { v4: uuidv4 } = require('uuid');
const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateCreateKey,
  validateGetKeysByAppId,
  validateDeleteKey,
} = require('../../middlewares/keyMiddlware');
const path = require('path');
const fs = require('fs');
const rootENV = path.join(process.cwd(), '..', '.env');
const serverENV = path.join(process.cwd(), '.env');
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
require('dotenv').config({ path: ENVPath });

router.post(
  '/newKey/:application_id',
  validate(validateCreateKey),
  async (req, res) => {
    try {
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

      const newKey = await ApiKey.create({
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
  validate(validateGetKeysByAppId),
  async (req, res) => {
    try {
      const { application_id } = req.params;

      const keys = await ApiKey.findAll({
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
router.delete('/:id', validate(validateDeleteKey), async (req, res) => {
  try {
    const id = req.params.id;
    const response = await ApiKey.destroy({
      where: { id: id },
    });

    return res.status(200).json({ message: `Deleted ${response} api key` });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
