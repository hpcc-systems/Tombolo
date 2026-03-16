import { dateTimeQuery, uuidQuery } from './commonMiddleware.js';

// Validation for GET /api/workunit-dashboard
const validateGetDashboardData = [
  dateTimeQuery('startDate', false),
  dateTimeQuery('endDate', false),
  uuidQuery('clusterId', true),
];

export { validateGetDashboardData };
