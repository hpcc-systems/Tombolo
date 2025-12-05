const express = require('express');
const {
  getWorkunits,
  getWorkunit,
  getWorkunitDetails,
  getWorkunitHotspots,
  getWorkunitTimeline,
} = require('../controllers/workunitController');
const {
  validateGetWorkunits,
  validateGetWorkunit,
  validateGetWorkunitDetails,
  validateGetWorkunitHotspots,
  validateGetWorkunitTimeline,
} = require('../middlewares/workunitMiddleware');
const { validate } = require('../middlewares/validateRequestBody');

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

module.exports = router;
