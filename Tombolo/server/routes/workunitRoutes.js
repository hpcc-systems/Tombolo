import express from 'express';
import {
  getWorkunits,
  getWorkunit,
  getWorkunitDetails,
  getWorkunitHotspots,
  getWorkunitTimeline,
  executeWorkunitSql,
} from '../controllers/workunitController.js';
import {
  validateGetWorkunits,
  validateGetWorkunit,
  validateGetWorkunitDetails,
  validateGetWorkunitHotspots,
  validateGetWorkunitTimeline,
  validateExecuteWorkunitSql,
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

// POST /api/workunits/:clusterId/:wuid/sql - Execute read-only SQL against work_unit_details
router.post(
  '/:clusterId/:wuid/sql',
  validate(validateExecuteWorkunitSql),
  executeWorkunitSql
);

export default router;
