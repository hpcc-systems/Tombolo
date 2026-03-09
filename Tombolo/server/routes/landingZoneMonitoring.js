// Imports from libraries
import express from 'express';
const router = express.Router();

// Middlewares
import {
  validateClusterId,
  validateFileListParams,
  validateCreateLandingZoneMonitoring,
  validateApplicationId,
  validateId,
  validateUpdateLandingZoneMonitoring,
  validateEvaluateLandingZoneMonitoring,
  validateToggleStatus,
  validateIds,
  validateBulkUpdatePayload,
} from '../middlewares/landingZoneMonitoringMiddleware.js';
import { validate } from '../middlewares/validateRequestBody.js';

// Controllers
import {
  getDropzonesForACluster,
  getFileList,
  createLandingZoneMonitoring,
  getAllLandingZoneMonitorings,
  getLandingZoneMonitoringById,
  updateLandingZoneMonitoring,
  deleteLandingZoneMonitoring,
  evaluateLandingZoneMonitoring,
  toggleLandingZoneMonitoringStatus,
  bulkDeleteLandingZoneMonitoring,
  bulkUpdateLzMonitoring,
} from '../controllers/landingZoneMonitoringController.js';

router.post(
  '/',
  validate(validateCreateLandingZoneMonitoring),
  createLandingZoneMonitoring
);
router.get(
  '/getDropzones',
  validate(validateClusterId),
  getDropzonesForACluster
);
router.get('/fileList', validate(validateFileListParams), getFileList);
router.get(
  '/all/:applicationId',
  validate(validateApplicationId),
  getAllLandingZoneMonitorings
);
router.get('/:id', validate(validateId), getLandingZoneMonitoringById);
router.patch(
  '/',
  validate(validateUpdateLandingZoneMonitoring),
  updateLandingZoneMonitoring
);
router.patch(
  '/evaluate',
  validate(validateEvaluateLandingZoneMonitoring),
  evaluateLandingZoneMonitoring
);
router.delete(
  '/bulkDelete',
  validate(validateIds),
  bulkDeleteLandingZoneMonitoring
);
router.delete('/:id', validate(validateId), deleteLandingZoneMonitoring);

router.patch(
  '/toggleStatus',
  validate(validateToggleStatus),
  toggleLandingZoneMonitoringStatus
);
router.patch(
  '/bulkUpdate',
  validate(validateBulkUpdatePayload),
  bulkUpdateLzMonitoring
);

// export the router
export default router;
