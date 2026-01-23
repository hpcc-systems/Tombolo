import sequelize from 'sequelize';
import express from 'express';

import { validate } from '../../middlewares/validateRequestBody.js';
import {
  validateIntegrationDetails,
  validateToggleStatus,
  validateUpdateIntegrationSettings,
} from '../../middlewares/integrationsMiddleware.js';
import logger from '../../config/logger.js';
import { sendError, sendSuccess } from '../../utils/response.js';
import { Integration, IntegrationMapping } from '../../models/index.js';

const router = express.Router();

//Get all integrations - active or not from integrations table
router.get('/all', async (req, res) => {
  try {
    const result = await Integration.findAll();
    return sendSuccess(res, result);
  } catch (err) {
    logger.error('integrations/read getAll: ', err);
    return sendError(res, 'Unable to get integrations');
  }
});

// Get all active integrations from the integrations to application mapping table
router.get('/getAllActive/', async (req, res) => {
  try {
    const integrationMappingDetails = await IntegrationMapping.findAll(
      {
        include: [
          {
            model: Integration,
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
    return sendSuccess(res, integrationMappingDetails);
  } catch (err) {
    logger.error('integrations/read getAllActive: ', err);
    return sendError(res, 'Failed to get active integrations');
  }
});

// Get integration details by integration relation ID
router.get(
  '/integrationDetails/:id',
  validate(validateIntegrationDetails),
  async (req, res) => {
    try {
      const result = await IntegrationMapping.findOne({
        where: {
          id: req.params.id,
        },
        attributes: [
          [sequelize.col('IntegrationMapping.id'), 'integrationMappingId'],
          [
            sequelize.col('IntegrationMapping.metaData'),
            'appSpecificIntegrationMetaData',
          ],
          'IntegrationMapping.application_id',
        ],
        include: [
          {
            model: Integration,
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

      return sendSuccess(res, result);
    } catch (err) {
      logger.error('integrations/read integrationDetails: ', err);
      return sendError(res, 'Failed to get integration details');
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
      const result = await IntegrationMapping.findOne({
        where: {
          application_id,
          integration_id: integrationId,
        },
        paranoid: false,
      });

      if (active) {
        if (result) {
          await IntegrationMapping.restore({
            where: {
              application_id,
              integration_id: integrationId,
            },
          });
        } else {
          await IntegrationMapping.create({
            application_id,
            integration_id: integrationId,
          });
        }
      } else {
        await IntegrationMapping.destroy({
          where: {
            application_id,
            integration_id: integrationId,
          },
        });
      }
      return sendSuccess(res, null, 'Integration status changed');
    } catch (err) {
      logger.error('integrations/read toggleStatus: ', err);
      return sendError(res, 'Unable to update the integration');
    }
  }
);

// Update the integration details (MetaData) by integration relation ID
router.put(
  '/updateIntegrationSettings/:id',
  validate(validateUpdateIntegrationSettings),
  async (req, res) => {
    try {
      const result = await IntegrationMapping.update(
        {
          metaData: req.body.integrationSettings,
        },
        {
          where: {
            id: req.params.id,
          },
        }
      );
      return sendSuccess(res, result);
    } catch (err) {
      logger.error('integrations/read updateIntegrationSettings: ', err);
      return sendError(res, 'Failed to update integration details');
    }
  }
);

export default router;
