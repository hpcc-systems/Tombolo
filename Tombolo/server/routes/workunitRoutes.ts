import express from 'express';
import {
  getWorkunits,
  getWorkunit,
  getWorkunitDetails,
  getWorkunitHotspots,
  getWorkunitTimeline,
  getJobHistoryByJobName,
  getJobHistoryByJobNameWStats,
  comparePreviousByWuid,
  getWorkunitGraph,
  getWorkunitScopes,
  getWorkunitScopesSummary,
  getScopeHistory,
} from '../controllers/workunitController.js';
import {
  validateGetWorkunits,
  validateGetWorkunit,
  validateGetWorkunitDetails,
  validateGetWorkunitHotspots,
  validateGetWorkunitTimeline,
  validateGetJobHistoryByJobName,
  validateGetJobHistoryByJobNameWStats,
  validateComparePreviousByWuid,
  validateGetWorkunitGraph,
  validateGetWorkunitScopes,
  validateGetWorkunitScopesSummary,
  validateGetScopeHistory,
} from '../middlewares/workunitMiddleware.js';
import { validate } from '../middlewares/validateRequestBody.js';

const router = express.Router();

// GET /api/workunits - List with filters
router.get('/', validate(validateGetWorkunits), getWorkunits);

// GET /api/workunits/:clusterId/:wuid - Single workunit
router.get('/:clusterId/:wuid', validate(validateGetWorkunit), getWorkunit);

// GET /api/workunits/:clusterId/:wuid/details - Hierarchical scope tree
router.get(
  '/:clusterId/:wuid/details',
  validate(validateGetWorkunitDetails),
  getWorkunitDetails
);

// GET /api/workunits/:clusterId/:wuid/hotspots - Top performance issues
router.get(
  '/:clusterId/:wuid/hotspots',
  validate(validateGetWorkunitHotspots),
  getWorkunitHotspots
);

// GET /api/workunits/:clusterId/:wuid/timeline - Timeline data
router.get(
  '/:clusterId/:wuid/timeline',
  validate(validateGetWorkunitTimeline),
  getWorkunitTimeline
);

router.get(
  '/:clusterId/job-history/:jobName',
  validate(validateGetJobHistoryByJobName),
  getJobHistoryByJobName
);

router.get(
  '/:clusterId/job-history/:jobName/stats',
  validate(validateGetJobHistoryByJobNameWStats),
  getJobHistoryByJobNameWStats
);

router.get(
  '/:clusterId/:wuid/compare-previous',
  validate(validateComparePreviousByWuid),
  comparePreviousByWuid
);

// GET /api/workunits/:clusterId/:wuid/graph - Live graph scopes from HPCC cluster
router.get(
  '/:clusterId/:wuid/graph',
  validate(validateGetWorkunitGraph),
  getWorkunitGraph
);

// Scopes: paged list, summary and scope history (used by virtualized UI)
// GET /api/workunits/:clusterId/:wuid/scopes
router.get(
  '/:clusterId/:wuid/scopes',
  validate(validateGetWorkunitScopes),
  getWorkunitScopes
);
// GET /api/workunits/:clusterId/:wuid/scopes/summary
router.get(
  '/:clusterId/:wuid/scopes/summary',
  validate(validateGetWorkunitScopesSummary),
  getWorkunitScopesSummary
);
// GET /api/workunits/:clusterId/:wuid/scopes/:scopeId/history
router.get(
  '/:clusterId/:wuid/scopes/:scopeId/history',
  validate(validateGetScopeHistory),
  getScopeHistory
);

export default router;
