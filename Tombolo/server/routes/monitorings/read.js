const express = require('express');
const router = express.Router();

//Local Imports
const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateCreateMonitoring,
  validateDeleteMonitoring,
  validateUpdateMonitoring,
  validateGetMonitoringByTypeName,
} = require('../../middlewares/monitoringMiddleware');
const { MonitoringType } = require('../../models');
const logger = require('../../config/logger');
const { sendError, sendSuccess } = require('../../utils/response');

// Route to get all monitoring types
router.get('/', async (req, res) => {
  try {
    const monitoringTypes = await MonitoringType.findAll();
    return sendSuccess(res, monitoringTypes);
  } catch (err) {
    logger.error('get monitoringTypes: ', err);
    return sendError(res, 'Failed to fetch monitoring types');
  }
});

// Note - this route is for testing only . Monitoring types should be seeded in the database
// Route to post a new monitoring type
router.post('/', validate(validateCreateMonitoring), async (req, res) => {
  try {
    const monitoringType = await MonitoringType.create(req.body);
    return sendSuccess(
      res,
      monitoringType,
      'Monitoring type created successfully'
    );
  } catch (error) {
    logger.error('create monitoringType: ', error);
    return sendError(res, 'Failed to create monitoring type');
  }
});

// Delete a monitoring type
router.delete('/:id', validate(validateDeleteMonitoring), async (req, res) => {
  try {
    const monitoringType = await MonitoringType.findByPk(req.params.id);
    if (!monitoringType) {
      return sendError(res, 'Monitoring type not found', 404);
    }
    await monitoringType.destroy();
    return sendSuccess(res, null, 'Monitoring type deleted successfully');
  } catch (error) {
    logger.error('delete monitoringType: ', error);
    return sendError(res, 'Failed to delete monitoring type');
  }
});

// update a monitoring type
router.put('/:id', validate(validateUpdateMonitoring), async (req, res) => {
  try {
    const monitoringType = await MonitoringType.findByPk(req.params.id);
    if (!monitoringType) {
      return sendError(res, 'Monitoring type not found', 404);
    }
    await monitoringType.update(req.body);
    return sendSuccess(
      res,
      monitoringType,
      'Monitoring type updated successfully'
    );
  } catch (error) {
    logger.error('update monitoringType: ', error);
    return sendError(res, 'Failed to update monitoring type');
  }
});

// Get monitoring type id by name, name is in the request body as monitoringTypeName
router.get(
  '/getMonitoringTypeId/:monitoringTypeName',
  validate(validateGetMonitoringByTypeName),
  async (req, res) => {
    try {
      const monitoringType = await MonitoringType.findOne({
        where: {
          name: req.params.monitoringTypeName,
        },
      });
      if (!monitoringType) {
        return sendError(res, 'Monitoring type not found', 404);
      }
      return sendSuccess(res, monitoringType.id);
    } catch (error) {
      logger.error('get monitoringTypeId', error);
      return sendError(res, 'Failed to get monitoring type id');
    }
  }
);

module.exports = router;
