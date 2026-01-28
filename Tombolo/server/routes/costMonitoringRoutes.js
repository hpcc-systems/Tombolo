import express from 'express';
const router = express.Router();

import {
  validateUpdateCostMonitoring,
  validateCreateCostMonitoring,
  validateDeleteCostMonitoring,
  validateGetCostMonitoringById,
  validateEvaluateCostMonitoring,
  validateToggleStatus,
  validateBulkDelete,
  validateBulkUpdate,
  validateGetCostMonitoringByAppId,
} from '../middlewares/costMonitoringMiddleware.js';
import { validate } from '../middlewares/validateRequestBody.js';
import {
  getCostMonitoringById,
  getCostMonitorings,
  deleteCostMonitoring,
  updateCostMonitoring,
  createCostMonitoring,
  evaluateCostMonitoring,
  toggleCostMonitoringActive,
  bulkDeleteCostMonitoring,
  bulkUpdateCostMonitoring,
} from '../controllers/costMonitoringController.js';

router.patch(
  '/evaluate',
  validate(validateEvaluateCostMonitoring),
  evaluateCostMonitoring
);

router.put(
  '/toggle',
  validate(validateToggleStatus),
  toggleCostMonitoringActive
);
router.delete('/bulk', validate(validateBulkDelete), bulkDeleteCostMonitoring);
router.patch('/bulk', validate(validateBulkUpdate), bulkUpdateCostMonitoring);

router.get(
  '/byId/:id',
  validate(validateGetCostMonitoringById),
  getCostMonitoringById
);
router.get(
  '/:applicationId',
  validate(validateGetCostMonitoringByAppId),
  getCostMonitorings
);
router.post('/', validate(validateCreateCostMonitoring), createCostMonitoring);

router.patch('/', validate(validateUpdateCostMonitoring), updateCostMonitoring);
router.delete(
  '/:id',
  validate(validateDeleteCostMonitoring),
  deleteCostMonitoring
);

export default router;
