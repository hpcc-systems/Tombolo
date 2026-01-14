// Imports from libraries
const express = require('express');
const router = express.Router();

// Middlewares
const {
  createOrbitMonitoringPayloadValidations,
  validateAppIdInReqParam,
  validateMonitoringIdInBody,
  validateUpdatePayload,
  deleteOrbitMonitoringPayloadValidations,
  monitoringTogglePayloadValidations,
  validateMonitoringEvaluationPayload,
  validateBulkUpdate,
} = require('../middlewares/orbitProfileMonitoringMiddleware');
const { validate } = require('../middlewares/validateRequestBody');

// Controllers
const {
  createOrbitProfileMonitoring,
  getAllOrbitProfileMonitorings,
  getOrbitProfileMonitoringById,
  updateOrbitProfileMonitoring,
  deleteOrbitProfileMonitoring,
  toggleOrbitProfileMonitoringStatus,
  evaluateOrbitProfileMonitoring,
  bulkUpdateOrbitProfileMonitoring,
} = require('../controllers/orbitProfileMonitoringController');

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

module.exports = router;
