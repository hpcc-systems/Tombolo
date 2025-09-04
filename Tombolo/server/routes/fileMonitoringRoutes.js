const express = require('express');
const router = express.Router();

const {
  validateUpdateFileMonitoring,
  validateCreateFileMonitoring,
  validateGetFileMonitoringById,
  validateEvaluateFileMonitoring,
  validateToggleStatus,
  validateBulkDelete,
  validateBulkUpdate,
  validateGetFileMonitoringByAppId,
} = require('../middlewares/fileMonitoringMiddleware');
const { validate } = require('../middlewares/validateRequestBody');
const {
  getFileMonitoringById,
  getFileMonitoring,
  updateFileMonitoring,
  createFileMonitoring,
  evaluateFileMonitoring,
  toggleFileMonitoringActive,
  deleteFileMonitoring,
  bulkUpdateFileMonitoring,
} = require('../controllers/fileMonitoringController');

router.post('/', validate(validateCreateFileMonitoring), createFileMonitoring);

router.put(
  '/:id',
  validate(validateUpdateFileMonitoring),
  updateFileMonitoring
);
router.get(
  '/:id',
  validate(validateGetFileMonitoringById),
  getFileMonitoringById
);
router.get(
  '/all/:applicationId',
  validate(validateGetFileMonitoringByAppId),
  getFileMonitoring
);

router.patch(
  '/evaluate',
  validate(validateEvaluateFileMonitoring),
  evaluateFileMonitoring
);

router.patch(
  '/toggle',
  validate(validateToggleStatus),
  toggleFileMonitoringActive
);
router.delete('/', validate(validateBulkDelete), deleteFileMonitoring);
router.patch('/bulk', validate(validateBulkUpdate), bulkUpdateFileMonitoring);

module.exports = router;
