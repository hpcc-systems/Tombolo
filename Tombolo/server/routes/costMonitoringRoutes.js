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
} = require('../middlewares/costMonitoringMiddlewares');

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
  validateEvaluateCostMonitoring,
  evaluateCostMonitoring
);

router.put('/toggle', validateToggleStatus, toggleCostMonitoringActive);
router.delete('/bulk', validateBulkDelete, bulkDeleteCostMonitoring);
router.patch('/bulk', validateBulkUpdate, bulkUpdateCostMonitoring);

router.get('/', getCostMonitorings);
router.get('/:id', validateGetCostMonitoringById, getCostMonitoringById);
router.post('/', validateCreateCostMonitoring, createCostMonitoring);

router.patch('/', validateUpdateCostMonitoring, updateCostMonitoring);
router.delete('/:id', validateDeleteCostMonitoring, deleteCostMonitoring);

module.exports = router;
