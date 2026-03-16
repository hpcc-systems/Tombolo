import express from 'express';
import { getDashboardData } from '../controllers/workunitDashboardController.js';
import { validateGetDashboardData } from '../middlewares/workunitDashboardMiddleware.js';
import { validate } from '../middlewares/validateRequestBody.js';

const router = express.Router();

/**
 * @route   GET /api/workunit-dashboard
 * @desc    Get workunit dashboard data with aggregations
 * @query   startDate (ISO date string, required)
 * @query   endDate (ISO date string, required)
 * @query   clusterId (UUID, optional)
 * @access  Private (requires authentication)
 */
router.get('/', validate(validateGetDashboardData), getDashboardData);

export default router;
