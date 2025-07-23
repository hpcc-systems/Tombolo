const express = require('express');
const router = express.Router();

const {
  validateUpdateCostMonitoring,
  validateCreateCostMonitoring,
  validateDeleteCostMonitoring,
  validateGetCostMonitoringById,
  validateEvaluateCostMonitoring,
  validateToggleStatus,
  validateBulkDelete,
  validateBulkUpdate,
  validateGetCostMonitoringByAppId,
} = require('../middlewares/costMonitoringMiddleware');
const { validate } = require('../middlewares/validateRequestBody');
const {
  getCostMonitoringById,
  getCostMonitorings,
  deleteCostMonitoring,
  updateCostMonitoring,
  createCostMonitoring,
  evaluateCostMonitoring,
  toggleCostMonitoringActive,
  bulkDeleteCostMonitoring,
  bulkUpdateCostMonitoring,
} = require('../controllers/costMonitoringController');

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

module.exports = router;
