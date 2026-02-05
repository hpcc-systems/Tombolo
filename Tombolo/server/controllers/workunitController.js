import { Op } from 'sequelize';
import { WorkUnit, WorkUnitDetails, sequelize } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/response.js';
import logger from '../config/logger.js';
// Build hierarchy from flat details (graphs, scoped by parent prefixes)
const buildScopeHierarchy = details => {
  const map = new Map();
  const roots = [];
  const orphans = [];

  details.forEach(item => {
    const key = item.scopeId || item.scopeName;
    const node = {
      ...item.get({ plain: true }),
      children: [],
    };
    map.set(key, node);
  });

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
        orphans.push(node);
      }
    } else {
      orphans.push(node);
    }
  });

  return [...roots, ...orphans];
};

async function getWorkunits(req, res) {
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
    if (owner) where.owner = { [Op.like]: `%${owner}%` };
    if (jobName) where.jobName = { [Op.like]: `%${jobName}%` };
    if (dateFrom) {
      where.workUnitTimestamp = where.workUnitTimestamp || {};
      where.workUnitTimestamp[Op.gte] = new Date(dateFrom);
    }
    if (dateTo) {
      where.workUnitTimestamp = where.workUnitTimestamp || {};
      where.workUnitTimestamp[Op.lte] = new Date(dateTo);
    }
    if (costAbove) {
      where.totalCost = where.totalCost || {};
      where.totalCost[Op.gt] = parseFloat(costAbove);
    }
    if (req.query.detailsFetched !== undefined) {
      if (req.query.detailsFetched === 'true') {
        where.detailsFetchedAt = { [Op.ne]: null };
      } else if (req.query.detailsFetched === 'false') {
        where.detailsFetchedAt = null;
      }
    }

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
        [sequelize.literal('detailsFetchedAt IS NOT NULL'), 'hasDetails'],
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
    logger.error('Get workunits error: ', err);
    return sendError(res, 'Failed to fetch workunits', 500);
  }
}

async function getWorkunit(req, res) {
  try {
    const wu = await WorkUnit.findOne({
      where: { wuId: req.params.wuid, clusterId: req.params.clusterId },
      attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
    });

    if (!wu) return sendError(res, 'Workunit not found', 404);

    return sendSuccess(res, wu.get({ plain: true }));
  } catch (err) {
    logger.error('Get workunit error: ', err);
    return sendError(res, 'Server error', 500);
  }
}

async function getWorkunitDetails(req, res) {
  try {
    const details = await WorkUnitDetails.findAll({
      where: { wuId: req.params.wuid, clusterId: req.params.clusterId },
      order: [['id', 'ASC']],
    });

    if (details.length === 0) {
      return sendError(res, 'No details found for this workunit', 404);
    }

    const graphs = buildScopeHierarchy(details);

    return sendSuccess(res, {
      wuId: req.params.wuid,
      clusterId: req.params.clusterId,
      fetchedAt: details[0].createdAt || new Date(),
      graphs,
    });
  } catch (err) {
    logger.error('Get workunit details error: ', err);
    return sendError(res, 'Failed to fetch details', 500);
  }
}

async function getWorkunitHotspots(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 15;

    const details = await WorkUnitDetails.findAll({
      where: { wuId: req.params.wuid, clusterId: req.params.clusterId },
      order: [['TimeElapsed', 'DESC']],
      limit,
    });

    return sendSuccess(
      res,
      details.map(d => d.get({ plain: true }))
    );
  } catch (err) {
    logger.error('Get wu details hotspots error: ', err);
    return sendError(res, 'Failed to fetch hotspots', 500);
  }
}

async function getWorkunitTimeline(req, res) {
  try {
    const details = await WorkUnitDetails.findAll({
      where: { wuId: req.params.wuid, clusterId: req.params.clusterId },
      order: [['TimeFirstRow', 'ASC']],
    });

    return sendSuccess(
      res,
      details.map(d => d.get({ plain: true }))
    );
  } catch (err) {
    logger.error('Get wu details timeline error: ', err);
    return sendError(res, 'Failed to fetch timeline', 500);
  }
}

async function getJobHistoryByJobName(req, res) {
  try {
    const { clusterId, jobName } = req.params;
    const { startDate, limit = 100 } = req.query;

    // Build where clause
    const where = {
      clusterId,
      jobName,
    };

    // Add date filter if provided
    if (startDate) {
      where.workUnitTimestamp = {
        [Op.gte]: new Date(startDate),
      };
    }

    // Fetch workunits
    const workunits = await WorkUnit.findAll({
      where,
      order: [['workUnitTimestamp', 'DESC']], // Most recent first
      limit: parseInt(limit),
      attributes: [
        'wuId',
        'jobName',
        'state',
        'workUnitTimestamp',
        'totalClusterTime',
        'totalCost',
        'owner',
        'clusterId',
      ],
    });

    return sendSuccess(res, workunits);
  } catch (error) {
    logger.error('Error fetching job history:', error);
    return sendError(res, 'Failed to fetch job history', 500);
  }
}

async function getJobHistoryByJobNameWStats(req, res) {
  try {
    const { clusterId, jobName } = req.params;
    const { startDate } = req.query;

    const where = {
      clusterId,
      jobName,
    };

    if (startDate) {
      where.workUnitTimestamp = {
        [Op.gte]: new Date(startDate),
      };
    }

    // Get all runs
    const workunits = await WorkUnit.findAll({
      where,
      order: [['workUnitTimestamp', 'DESC']],
      attributes: [
        'wuId',
        'jobName',
        'state',
        'workUnitTimestamp',
        'totalClusterTime',
        'totalCost',
        'owner',
        'clusterId',
      ],
    });

    // Calculate statistics on the backend
    const completed = workunits.filter(w => w.state === 'completed');
    const durations = completed
      .map(w => w.totalClusterTime)
      .filter(d => d != null);

    const stats = {
      totalRuns: workunits.length,
      completedRuns: completed.length,
      failedRuns: workunits.filter(w => w.state === 'failed').length,
      successRate:
        workunits.length > 0 ? (completed.length / workunits.length) * 100 : 0,
      avgDuration:
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
    };

    return sendSuccess(res, {
      runs: workunits,
      statistics: stats,
    });
  } catch (error) {
    logger.error('Error fetching job history with stats:', error);
    return sendError(res, 'Failed to fetch job history', 500);
  }
}

async function comparePreviousByWuid(req, res) {
  try {
    const { clusterId, wuid } = req.params;

    // Get current workunit
    const current = await WorkUnit.findOne({
      where: { clusterId, wuId: wuid },
    });

    if (!current) {
      return res.status(404).json({ error: 'Workunit not found' });
    }

    // Get previous run of same job
    const previous = await WorkUnit.findOne({
      where: {
        clusterId,
        jobName: current.jobName,
        workUnitTimestamp: {
          [Op.lt]: current.workUnitTimestamp,
        },
      },
      order: [['workUnitTimestamp', 'DESC']],
    });

    if (!previous) {
      return sendSuccess(res, {
        current,
        previous: null,
        comparison: null,
      });
    }

    // Calculate comparison metrics
    const durationChange =
      current.totalClusterTime != null && previous.totalClusterTime != null
        ? ((current.totalClusterTime - previous.totalClusterTime) /
            previous.totalClusterTime) *
          100
        : null;

    const costChange =
      current.totalCost != null && previous.totalCost != null
        ? ((current.totalCost - previous.totalCost) / previous.totalCost) * 100
        : null;

    const timeDelta =
      current.totalClusterTime != null && previous.totalClusterTime != null
        ? current.totalClusterTime - previous.totalClusterTime
        : null;

    const costDelta =
      current.totalCost != null && previous.totalCost != null
        ? current.totalCost - previous.totalCost
        : null;

    return sendSuccess(res, {
      current,
      previous,
      comparison: {
        durationChange,
        costChange,
        timeDelta,
        costDelta,
      },
    });
  } catch (error) {
    logger.error('Error comparing workunits:', error);
    return sendError(res, 'Failed to compare workunits', 500);
  }
}

export {
  getWorkunits,
  getWorkunit,
  getWorkunitDetails,
  getWorkunitHotspots,
  getWorkunitTimeline,
  getJobHistoryByJobName,
  getJobHistoryByJobNameWStats,
  comparePreviousByWuid,
};
