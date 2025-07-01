const express = require('express');
const router = express.Router();

const {
  validateUpdateCostMonitoring,
  validateCreateCostMonitoring,
  validateDeleteCostMonitoring,
  validateGetCostMonitoringById,
} = require('../middlewares/costMonitoringMiddlewares');

const {
  getCostMonitoringById,
  getCostMonitorings,
  deleteCostMonitoring,
  updateCostMonitoring,
  createCostMonitoring,
} = require('../controllers/costMonitoringController');

router.get('/', getCostMonitorings);
router.get('/:id', validateGetCostMonitoringById, getCostMonitoringById);
router.post('/', validateCreateCostMonitoring, createCostMonitoring);
router.put('/', validateUpdateCostMonitoring, updateCostMonitoring);
router.delete('/:id', validateDeleteCostMonitoring, deleteCostMonitoring);

module.exports = router;
