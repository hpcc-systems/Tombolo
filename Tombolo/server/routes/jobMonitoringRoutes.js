import express from 'express';
const router = express.Router();

//Local imports
import { validate } from '../middlewares/validateRequestBody.js';
import {
  validateCreateJobMonitoring,
  validateParamApplicationId,
  validateUpdateJobMonitoring,
  validateEvaluateJobMonitoring,
  validateBulkDeleteJobMonitoring,
  validateDeleteJobMonitoring,
  validateToggleJobMonitoring,
  validateBulkUpdateJobMonitoring,
  validateGetJobMonitoringById,
} from '../middlewares/jobMonitoringMiddleware.js';
import {
  createJobMonitoring,
  getAllJobMonitorings,
  getJobMonitoringById,
  patchJobMonitoring,
  evaluateJobMonitoring,
  bulkDeleteJobMonitoring,
  deleteJobMonitoring,
  toggleJobMonitoring,
  bulkUpdateJobMonitoring,
  getJobMonitoringData,
} from '../controllers/jobMonitoringController.js';

// Create new job monitoring
router.post('/', validate(validateCreateJobMonitoring), createJobMonitoring);

// Get all Job monitorings
router.get(
  '/all/:applicationId',
  validate(validateParamApplicationId),
  getAllJobMonitorings
);

// Get a single job monitoring
router.get('/:id', getJobMonitoringById);

// Patch a single job monitoring
router.patch('/', validate(validateUpdateJobMonitoring), patchJobMonitoring);

// Reject or approve monitoring
router.patch(
  '/evaluate',
  validate(validateEvaluateJobMonitoring),
  evaluateJobMonitoring
);

// Bulk delete
router.delete(
  '/bulkDelete',
  validate(validateBulkDeleteJobMonitoring),
  bulkDeleteJobMonitoring
);

//Delete a single job monitoring
router.delete(
  '/:id',
  validate(validateDeleteJobMonitoring),
  deleteJobMonitoring
);

// Toggle job monitoring
router.patch(
  '/toggleIsActive',
  validate(validateToggleJobMonitoring),
  toggleJobMonitoring
);

// Bulk update - only primary, secondary and notify contact are part of bulk update for now
router.patch(
  '/bulkUpdate',
  validate(validateBulkUpdateJobMonitoring),
  bulkUpdateJobMonitoring
);

// Get Job Monitoring Data by JM ID
router.get(
  '/data/:id',
  validate(validateGetJobMonitoringById),
  getJobMonitoringData
);

// Export the router
export default router;
