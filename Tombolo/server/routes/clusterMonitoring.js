const express = require('express');
const router = express.Router();
const { validate } = require('../middlewares/validateRequestBody');
const {
  createClusterStatusMonitoring,
  getClusterStatusMonitoringById,
  getAllClusterStatusMonitoring,
  updateClusterStatusMonitoring,
  toggleClusterStatusMonitoringStatus,
  evaluateClusterStatusMonitoring,
  bulkUpdateClusterStatusMonitoring,
  deleteClusterStatusMonitoring,
} = require('../controllers/clusterMonitoringController');

const {
  createOrUpdateMonitoringPayload,
  monitoringIdAsParam,
  monitoringIdOnBody,
  evaluateMonitoringPayload,
  bulkUpdateContacts,
  deleteMonitoringPayload,
} = require('../middlewares/clusterStatusMonitoringMiddleware');

// Create
router.post(
  '/',
  validate(createOrUpdateMonitoringPayload),
  createClusterStatusMonitoring
);

// Get by ID
router.get(
  '/:id',
  validate(monitoringIdAsParam),
  getClusterStatusMonitoringById
);

// Get all (no filters)
router.get('/', getAllClusterStatusMonitoring);

// Update any field
router.put(
  '/',
  validate(monitoringIdOnBody),
  validate(createOrUpdateMonitoringPayload),
  updateClusterStatusMonitoring
);

// Start and pause
router.patch(
  '/toggleStatus',
  validate(monitoringIdOnBody),
  toggleClusterStatusMonitoringStatus
);

// Approve and reject
router.patch(
  '/evaluate',
  validate(evaluateMonitoringPayload),
  evaluateClusterStatusMonitoring
);

// Bulk update
router.patch(
  '/bulkUpdate',
  validate(bulkUpdateContacts),
  bulkUpdateClusterStatusMonitoring
);

// Delete (handles single ID or array of IDs)
router.delete(
  '/',
  validate(deleteMonitoringPayload),
  deleteClusterStatusMonitoring
);

module.exports = router;
