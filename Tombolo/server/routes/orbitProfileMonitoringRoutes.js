// Imports from libraries
const express = require('express');
const router = express.Router();

// Middlewares
const {
  createOrbitMonitoringPayloadValidations,
  validateApplicationIdInReqParam,
} = require('../middlewares/orbitProfileMonitoringMiddleware');
const { validate } = require('../middlewares/validateRequestBody');

// Controllers
const {
  createOrbitProfileMonitoring,
  getAllOrbitProfileMonitorings,
} = require('../controllers/orbitProfileMonitoringController');

// Routes
router.post(
  '/:applicationId',
  validate(createOrbitMonitoringPayloadValidations),
  createOrbitProfileMonitoring
);

router.get(
  '/:applicationId',
  validate(validateApplicationIdInReqParam),
  getAllOrbitProfileMonitorings
);

// router.get(
//   '/:applicationId/:id',
//   validateApplicationId,
//   validateId,
//   validate,
//   getOrbitProfileMonitoringById
// );

// // PUT /api/orbitprofilemonitoring/:applicationId/:id - Update orbit profile monitoring
// router.put(
//   '/:applicationId/:id',
//   validateApplicationId,
//   validateId,
//   validateUpdateOrbitProfileMonitoring,
//   validate,
//   updateOrbitProfileMonitoring
// );

// // DELETE /api/orbitprofilemonitoring/:applicationId/:id - Delete orbit profile monitoring
// router.delete(
//   '/:applicationId/:id',
//   validateApplicationId,
//   validateId,
//   validate,
//   deleteOrbitProfileMonitoring
// );

// // PATCH /api/orbitprofilemonitoring/:applicationId/:id/toggle - Toggle monitoring status
// router.patch(
//   '/:applicationId/:id/toggle',
//   validateApplicationId,
//   validateId,
//   validateToggleStatus,
//   validate,
//   toggleOrbitProfileMonitoringStatus
// );

// // POST /api/orbitprofilemonitoring/:applicationId/bulk-update - Bulk update multiple monitorings
// router.post(
//   '/:applicationId/bulk-update',
//   validateApplicationId,
//   validateIds,
//   validateBulkUpdatePayload,
//   validate,
//   bulkUpdateOrbitProfileMonitorings
// );

// // PATCH /api/orbitprofilemonitoring/:applicationId/:id/approve - Approve monitoring
// router.patch(
//   '/:applicationId/:id/approve',
//   validateApplicationId,
//   validateId,
//   validate,
//   approveOrbitProfileMonitoring
// );

// // PATCH /api/orbitprofilemonitoring/:applicationId/:id/reject - Reject monitoring
// router.patch(
//   '/:applicationId/:id/reject',
//   validateApplicationId,
//   validateId,
//   validate,
//   rejectOrbitProfileMonitoring
// );

// // POST /api/orbitprofilemonitoring/search-builds - Search for orbit builds
// router.post('/search-builds', searchOrbitBuilds);

// // POST /api/orbitprofilemonitoring/test-connection - Test orbit server connection
// router.post('/test-connection', testOrbitConnection);

module.exports = router;
