import express from 'express';
const router = express.Router();

//Local Imports
import { validate } from '../middlewares/validateRequestBody.js';
import {
  validateCreateMonitoring,
  validateDeleteMonitoring,
  validateUpdateMonitoring,
  validateGetMonitoringByTypeName,
} from '../middlewares/monitoringMiddleware.js';
import {
  getMonitoringTypes,
  createMonitoringType,
  deleteMonitoringType,
  updateMonitoringType,
  getMonitoringTypeByName,
} from '../controllers/monitoringTypeController.js';

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

export default router;
