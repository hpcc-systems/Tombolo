// routes/workunits.js
const express = require('express');
const { Op } = require('sequelize');
const { WorkUnit, WorkUnitDetails, sequelize } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();

// Helper: build hierarchy from flat details
const buildScopeHierarchy = details => {
  const map = new Map();
  const roots = [];
  const orphans = [];

  // First pass: create all nodes
  details.forEach(item => {
    const key = item.scopeId || item.scopeName;
    const node = {
      ...item.get({ plain: true }),
      children: [],
    };
    map.set(key, node);
  });

  // Second pass: build hierarchy
  details.forEach(item => {
    const key = item.scopeId || item.scopeName;
    const node = map.get(key);

    if (item.scopeType === 'graph') {
      roots.push(node);
    } else if (item.scopeId && item.scopeId.includes(':')) {
      const parentKey = item.scopeId.split(':').slice(0, -1).join(':');
      const parent = map.get(parentKey);
      if (parent) {
        parent.children.push(node);
      } else {
        // If parent not found, treat as orphan (add to roots)
        orphans.push(node);
      }
    } else {
      // No parent reference, treat as root-level
      orphans.push(node);
    }
  });

  // Return roots plus any orphaned nodes
  return [...roots, ...orphans];
};

// GET /api/workunits - List with filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      clusterId,
      state,
      owner,
      jobName,
      dateFrom,
      dateTo,
      costAbove,
      sort = 'workUnitTimestamp',
      order = 'desc',
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (clusterId) where.clusterId = clusterId;
    if (state) where.state = { [Op.in]: state.split(',') };
    if (owner) where.owner = { [Op.iLike]: `%${owner}%` };
    if (jobName) where.jobName = { [Op.iLike]: `%${jobName}%` };
    if (dateFrom)
      where.workUnitTimestamp = {
        ...where.workUnitTimestamp,
        [Op.gte]: new Date(dateFrom),
      };
    if (dateTo)
      where.workUnitTimestamp = {
        ...where.workUnitTimestamp,
        [Op.lte]: new Date(dateTo),
      };
    if (costAbove)
      where.totalCost = { ...where.totalCost, [Op.gt]: parseFloat(costAbove) };

    const { count, rows } = await WorkUnit.findAndCountAll({
      where,
      attributes: [
        'wuId',
        'clusterId',
        'jobName',
        'owner',
        'state',
        'totalClusterTime',
        'totalCost',
        'workUnitTimestamp',
        'detailsFetchedAt',
        [
          sequelize.literal(
            'EXISTS(SELECT 1 FROM `work_unit_details` WHERE `work_unit_details`.`wuId` = `WorkUnit`.`wuId`)'
          ),
          'hasDetails',
        ],
      ],
      order: [[sort, order]],
      limit: parseInt(limit),
      offset,
      raw: true,
    });

    return sendSuccess(res, {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      data: rows,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch workunits', 500);
  }
});

// GET /api/workunits/:wuid - Single workunit
router.get('/:wuid', async (req, res) => {
  try {
    const wu = await WorkUnit.findByPk(req.params.wuid, {
      attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
    });

    if (!wu) return sendError(res, 'Workunit not found', 404);

    return sendSuccess(res, wu.get({ plain: true }));
  } catch (err) {
    console.error(err);
    return sendError(res, 'Server error', 500);
  }
});

// GET /api/workunits/:wuid/details - Hierarchical scope tree
router.get('/:wuid/details', async (req, res) => {
  try {
    const details = await WorkUnitDetails.findAll({
      where: { wuId: req.params.wuid },
      order: [['id', 'ASC']],
    });

    if (details.length === 0) {
      return sendError(res, 'No details found for this workunit', 404);
    }

    const graphs = buildScopeHierarchy(details);

    return sendSuccess(res, {
      wuId: req.params.wuid,
      fetchedAt: details[0].createdAt || new Date(),
      graphs,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch details', 500);
  }
});

// GET /api/workunits/:wuid/hotspots - Top performance issues
router.get('/:wuid/hotspots', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 15;

    const hotspots = await WorkUnitDetails.findAll({
      where: {
        wuId: req.params.wuid,
        scopeType: 'activity',
        TimeElapsed: { [Op.not]: null },
      },
      attributes: [
        'scopeName',
        'label',
        'fileName',
        'TimeElapsed',
        'SkewMaxElapsed',
        'NumRowsProcessed',
        'SizeDiskRead',
        'SizeGraphSpill',
      ],
      order: [
        [sequelize.fn('COALESCE', sequelize.col('TimeElapsed'), 0), 'DESC'],
      ],
      limit,
      raw: true,
    });

    return sendSuccess(res, hotspots);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch hotspots', 500);
  }
});

// GET /api/workunits/:wuid/timeline - For Gantt/Timeline tab
router.get('/:wuid/timeline', async (req, res) => {
  try {
    const activities = await WorkUnitDetails.findAll({
      where: {
        wuId: req.params.wuid,
        scopeType: 'activity',
        TimeElapsed: { [Op.gt]: 0.01 },
      },
      attributes: [
        'scopeName',
        'label',
        'TimeFirstRow',
        'TimeElapsed',
        'SkewMaxElapsed',
      ],
      order: [[sequelize.coalesce(sequelize.col('TimeFirstRow'), 0), 'ASC']],
      raw: true,
    });

    const timeline = activities.map(a => ({
      ...a,
      start: a.TimeFirstRow || 0,
      duration: a.TimeElapsed || 0,
      end: (a.TimeFirstRow || 0) + (a.TimeElapsed || 0),
    }));

    return sendSuccess(res, timeline);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to build timeline', 500);
  }
});

module.exports = router;
