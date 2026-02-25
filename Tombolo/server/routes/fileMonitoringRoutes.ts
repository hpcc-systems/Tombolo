import express from 'express';
const router = express.Router();

import {
  validateUpdateFileMonitoring,
  validateCreateFileMonitoring,
  validateGetFileMonitoringById,
  validateEvaluateFileMonitoring,
  validateToggleStatus,
  validateBulkDelete,
  validateBulkUpdate,
  validateGetFileMonitoringByAppId,
} from '../middlewares/fileMonitoringMiddleware.js';
import { validate } from '../middlewares/validateRequestBody.js';
import {
  getFileMonitoringById,
  getFileMonitoring,
  updateFileMonitoring,
  createFileMonitoring,
  evaluateFileMonitoring,
  toggleFileMonitoringActive,
  deleteFileMonitoring,
  bulkUpdateFileMonitoring,
} from '../controllers/fileMonitoringController.js';

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

export default router;
