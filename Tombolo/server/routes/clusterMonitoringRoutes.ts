import express from 'express';
const router = express.Router();
import { validate } from '../middlewares/validateRequestBody.js';
import {
  createClusterMonitoring,
  getClusterMonitoringById,
  getAllClusterMonitoring,
  updateClusterMonitoring,
  toggleClusterMonitoringStatus,
  evaluateClusterMonitoring,
  bulkUpdateClusterMonitoring,
  deleteClusterMonitoring,
  toggleBulkClusterMonitoringStatus,
} from '../controllers/clusterMonitoringController.js';

import {
  createOrUpdateMonitoringPayload,
  monitoringIdAsParam,
  monitoringIdOnBody,
  evaluateMonitoringPayload,
  deleteMonitoringPayload,
} from '../middlewares/clusterMonitoringMiddleware.js';

// Create
router.post(
  '/',
  validate(createOrUpdateMonitoringPayload),
  createClusterMonitoring
);

// Get by ID
router.get('/:id', validate(monitoringIdAsParam), getClusterMonitoringById);

// Get all (no filters)
router.get('/', getAllClusterMonitoring);

// Update any field
router.put(
  '/',
  validate(monitoringIdOnBody),
  validate(createOrUpdateMonitoringPayload),
  updateClusterMonitoring
);

// Start and pause
router.patch(
  '/toggle',
  validate(monitoringIdOnBody),
  toggleClusterMonitoringStatus
);

// Bulk toggle active status
router.patch('/bulkToggle', toggleBulkClusterMonitoringStatus);

// Approve and reject
router.patch(
  '/evaluate',
  validate(evaluateMonitoringPayload),
  evaluateClusterMonitoring
);

// Bulk update
router.patch('/bulkUpdate', bulkUpdateClusterMonitoring);

// Delete (handles single ID or array of IDs)
router.delete('/', validate(deleteMonitoringPayload), deleteClusterMonitoring);

export default router;
