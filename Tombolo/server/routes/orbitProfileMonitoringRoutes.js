// Imports from libraries
import express from 'express';
const router = express.Router();

// Middlewares
import {
  createOrbitMonitoringPayloadValidations,
  validateAppIdInReqParam,
  validateMonitoringIdInBody,
  validateUpdatePayload,
  deleteOrbitMonitoringPayloadValidations,
  monitoringTogglePayloadValidations,
  validateMonitoringEvaluationPayload,
  validateBulkUpdate,
} from '../middlewares/orbitProfileMonitoringMiddleware.js';
import { validate } from '../middlewares/validateRequestBody.js';

// Controllers
import {
  createOrbitProfileMonitoring,
  getAllOrbitProfileMonitorings,
  getOrbitProfileMonitoringById,
  updateOrbitProfileMonitoring,
  deleteOrbitProfileMonitoring,
  toggleOrbitProfileMonitoringStatus,
  evaluateOrbitProfileMonitoring,
  bulkUpdateOrbitProfileMonitoring,
} from '../controllers/orbitProfileMonitoringController.js';

// Routes
router.post(
  '/',
  validate(createOrbitMonitoringPayloadValidations),
  createOrbitProfileMonitoring
);

router.get(
  '/getAll/:applicationId',
  validate(validateAppIdInReqParam),
  getAllOrbitProfileMonitorings
);

router.get(
  '/getOne/:id',
  validate(validateMonitoringIdInBody),
  getOrbitProfileMonitoringById
);

router.put(
  '/:id',
  validate(validateUpdatePayload),
  updateOrbitProfileMonitoring
);

router.delete(
  '/',
  validate(deleteOrbitMonitoringPayloadValidations),
  deleteOrbitProfileMonitoring
);

router.patch(
  '/toggleStatus',
  validate(monitoringTogglePayloadValidations),
  toggleOrbitProfileMonitoringStatus
);

router.patch(
  '/evaluate',
  validate(validateMonitoringEvaluationPayload),
  evaluateOrbitProfileMonitoring
);

router.patch(
  '/bulk',
  validate(validateBulkUpdate),
  bulkUpdateOrbitProfileMonitoring
);

export default router;
