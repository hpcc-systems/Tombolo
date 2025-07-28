const sequelize = require('sequelize');
const express = require('express');

const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateIntegrationDetails,
  validateToggleStatus,
  validateUpdateIntegrationSettings,
} = require('../../middlewares/integrationsMiddleware');
const logger = require('../../config/logger');
const { integrations, integration_mapping } = require('../../models');

const router = express.Router();

//Get all integrations - active or not from integrations table
router.get('/all', async (req, res) => {
  try {
    const result = await integrations.findAll();
    return res.status(200).send(result);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Unable to get integrations' });
  }
});

// Get all active integrations from the integrations to application mapping table
router.get('/getAllActive/', async (req, res) => {
  try {
    const integrationMappingDetails = await integration_mapping.findAll(
      {
        include: [
          {
            model: integrations,
            as: 'integration',
            required: true,
            attributes: ['name', 'description', 'metaData'],
          },
        ],
      },
      {
        raw: true,
      }
    );
    return res.status(200).send(integrationMappingDetails);
  } catch (err) {
    logger.error(err);
    return res.status(500).send('Failed to get active integrations: ' + err);
  }
});

// Get integration details by integration relation ID
router.get(
  '/integrationDetails/:id',
  validate(validateIntegrationDetails),
  async (req, res) => {
    try {
      const result = await integration_mapping.findOne({
        where: {
          id: req.params.id,
        },
        attributes: [
          [sequelize.col('integration_mapping.id'), 'integrationMappingId'],
          [
            sequelize.col('integration_mapping.metaData'),
            'appSpecificIntegrationMetaData',
          ],
          'integration_mapping.application_id',
        ],
        include: [
          {
            model: integrations,
            as: 'integration',
            required: true,
            attributes: [
              [sequelize.col('id'), 'integrationId'],
              [sequelize.col('name'), 'integrationName'],
              [sequelize.col('description'), 'integrationDescription'],
              [sequelize.col('metaData'), 'integrationMetaData'],
            ],
          },
        ],
      });

      return res.status(200).send(result);
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Failed to get integration details');
    }
  }
);

// Change the active status of an integration
router.post(
  '/toggleStatus',
  validate(validateToggleStatus),
  async (req, res) => {
    try {
      /*
     Intention to active
       1. restore if soft deleted
       2. create if not exists
     Intention to deactivate
      1. destroy if exists
      */
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
          await integration_mapping.restore({
            where: {
              application_id,
              integration_id: integrationId,
            },
          });
        } else {
          await integration_mapping.create({
            application_id,
            integration_id: integrationId,
          });
        }
      } else {
        await integration_mapping.destroy({
          where: {
            application_id,
            integration_id: integrationId,
          },
        });
      }
      return res.status(200).json({ message: 'Integration status changed' });
    } catch (err) {
      logger.error(err);
      return res
        .status(500)
        .json({ message: 'Unable to update the integration' });
    }
  }
);

// Update the integration details (MetaData) by integration relation ID
router.put(
  '/updateIntegrationSettings/:id',
  validate(validateUpdateIntegrationSettings),
  async (req, res) => {
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
      return res.status(200).send(result);
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Failed to update integration details');
    }
  }
);

module.exports = router;
