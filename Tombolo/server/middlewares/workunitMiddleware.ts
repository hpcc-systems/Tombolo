import {
  stringParam,
  stringQuery,
  intQuery,
  dateTimeQuery,
} from './commonMiddleware.js';

// Valid sort fields for workunits
const VALID_SORT_FIELDS = [
  'workUnitTimestamp',
  'totalCost',
  'totalClusterTime',
  'jobName',
  'owner',
  'state',
];

// Valid order directions
const VALID_ORDER_DIRECTIONS = ['asc', 'desc', 'ASC', 'DESC'];

// Validation for GET /api/workunits (list with filters)
const validateGetWorkunits = [
  intQuery('page', true),
  intQuery('limit', true),
  stringQuery('clusterId', true),
  stringQuery('state', true), // comma-separated list
  stringQuery('owner', true),
  stringQuery('jobName', true),
  dateTimeQuery('dateFrom', true),
  dateTimeQuery('dateTo', true),
  stringQuery('costAbove', true),
  stringQuery('sort', true, {
    isIn: VALID_SORT_FIELDS,
  }),
  stringQuery('order', true, {
    isIn: VALID_ORDER_DIRECTIONS,
  }),
  stringQuery('detailsFetched', true, {
    isIn: ['true', 'false'],
  }),
];

// Validation for GET /api/workunits/:clusterId/:wuid
const validateGetWorkunit = [
  stringParam('clusterId', false),
  stringParam('wuid', false),
];

// Validation for GET /api/workunits/:clusterId/:wuid/details
const validateGetWorkunitDetails = [
  stringParam('clusterId', false),
  stringParam('wuid', false),
];

// Validation for GET /api/workunits/:clusterId/:wuid/hotspots
const validateGetWorkunitHotspots = [
  stringParam('clusterId', false),
  stringParam('wuid', false),
  intQuery('limit', true),
];

// Validation for GET /api/workunits/:clusterId/:wuid/timeline
const validateGetWorkunitTimeline = [
  stringParam('clusterId', false),
  stringParam('wuid', false),
];

// Validation for GET /api/workunits/:clusterId/job-history/:jobName
const validateGetJobHistoryByJobName = [
  stringParam('clusterId', false),
  stringParam('jobName', false),
  dateTimeQuery('startDate', true),
  intQuery('limit', true),
];

// Validation for GET /api/workunits/:clusterId/job-history/:jobName/stats
const validateGetJobHistoryByJobNameWStats = [
  stringParam('clusterId', false),
  stringParam('jobName', false),
  dateTimeQuery('startDate', true),
];

// Validation for GET /api/workunits/:clusterId/:wuid/compare-previous
const validateComparePreviousByWuid = [
  stringParam('clusterId', false),
  stringParam('wuid', false),
];

export {
  validateGetWorkunits,
  validateGetWorkunit,
  validateGetWorkunitDetails,
  validateGetWorkunitHotspots,
  validateGetWorkunitTimeline,
  VALID_SORT_FIELDS,
  VALID_ORDER_DIRECTIONS,
  validateGetJobHistoryByJobName,
  validateGetJobHistoryByJobNameWStats,
  validateComparePreviousByWuid,
};
