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
const { monitoring_types: MonitoringTypes } = require('../../models');
const logger = require('../../config/logger');

// Route to get all monitoring types
router.get('/', async (req, res) => {
  try {
    const monitoringTypes = await MonitoringTypes.findAll();
    return res.status(200).json(monitoringTypes);
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .json({ message: 'Failed to fetch monitoring types' });
  }
});

// Note - this route is for testing only . Monitoring types should be seeded in the database
// Route to post a new monitoring type
router.post('/', validate(validateCreateMonitoring), async (req, res) => {
  try {
    const monitoringType = await MonitoringTypes.create(req.body);
    return res.status(200).json(monitoringType);
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ message: 'Failed to create monitoring type' });
  }
});

// Delete a monitoring type
router.delete('/:id', validate(validateDeleteMonitoring), async (req, res) => {
  try {
    const monitoringType = await MonitoringTypes.findByPk(req.params.id);
    if (!monitoringType) {
      return res.status(404).json({ message: 'Monitoring type not found' });
    }
    await monitoringType.destroy();
    return res
      .status(200)
      .json({ message: 'Monitoring type deleted successfully' });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ message: 'Failed to delete monitoring type' });
  }
});

// update a monitoring type
router.put('/:id', validate(validateUpdateMonitoring), async (req, res) => {
  try {
    const monitoringType = await MonitoringTypes.findByPk(req.params.id);
    if (!monitoringType) {
      return res.status(404).json({ message: 'Monitoring type not found' });
    }
    await monitoringType.update(req.body);
    return res.status(200).json(monitoringType);
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ message: 'Failed to update monitoring type' });
  }
});

// Get monitoring type id by name, name is in the request body as monitoringTypeName
router.get(
  '/getMonitoringTypeId/:monitoringTypeName',
  validate(validateGetMonitoringByTypeName),
  async (req, res) => {
    try {
      const monitoringType = await MonitoringTypes.findOne({
        where: {
          name: req.params.monitoringTypeName,
        },
      });
      if (!monitoringType) {
        return res.status(404).json({ message: 'Monitoring type not found' });
      }
      return res.status(200).json(monitoringType.id);
    } catch (error) {
      logger.error(error);
      return res
        .status(500)
        .json({ message: 'Failed to get monitoring type id' });
    }
  }
);

module.exports = router;
