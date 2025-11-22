const express = require('express');
const router = express.Router();

//Local Imports
const { validate } = require('../middlewares/validateRequestBody');
const {
  validateCreateMonitoring,
  validateDeleteMonitoring,
  validateUpdateMonitoring,
  validateGetMonitoringByTypeName,
} = require('../middlewares/monitoringMiddleware');
const {
  getMonitoringTypes,
  createMonitoringType,
  deleteMonitoringType,
  updateMonitoringType,
  getMonitoringTypeByName,
} = require('../controllers/monitoringTypeController');

// Route to get all monitoring types
router.get('/', getMonitoringTypes);

// Note - this route is for testing only. Monitoring types should be seeded in the database
// Route to post a new monitoring type
router.post('/', validate(validateCreateMonitoring), createMonitoringType);

// Delete a monitoring type
router.delete('/:id', validate(validateDeleteMonitoring), deleteMonitoringType);

// update a monitoring type
router.put('/:id', validate(validateUpdateMonitoring), updateMonitoringType);

// Get monitoring type id by name, name is in the request body as monitoringTypeName
router.get(
  '/getMonitoringTypeId/:monitoringTypeName',
  validate(validateGetMonitoringByTypeName),
  getMonitoringTypeByName
);

module.exports = router;
