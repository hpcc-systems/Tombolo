import { Request, Response } from 'express';
import { Op, WhereOptions, InferAttributes } from 'sequelize';
import { Workunit } from '@hpcc-js/comms';
import { WorkUnit, WorkUnitDetails, sequelize } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/response.js';
import logger from '../config/logger.js';
import { getCluster } from '../utils/hpcc-util.js';
import { getClusterOptions } from '../utils/getClusterOptions.js';
import { findFuzzyMatches } from '@tombolo/shared';

type ScopeNode = InferAttributes<WorkUnitDetails> & { children: ScopeNode[] };

interface WorkUnitAggregate {
  totalCost: string | null;
  avgClusterTime: string | null;
}

// Build hierarchy from flat details (graphs, scoped by parent prefixes)
const buildScopeHierarchy = (details: WorkUnitDetails[]): ScopeNode[] => {
  const map = new Map<string, ScopeNode>();
  const roots: ScopeNode[] = [];
  const orphans: ScopeNode[] = [];

  details.forEach(item => {
    const key = item.scopeId || item.scopeName;
    const node: ScopeNode = {
      ...item.get({ plain: true }),
      children: [],
    };
    map.set(key, node);
  });

  details.forEach(item => {
    const key = item.scopeId || item.scopeName;
    const node = map.get(key)!;

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

async function getWorkunits(req: Request, res: Response) {
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

    const offset = (Number(page) - 1) * Number(limit);
    const where: WhereOptions<InferAttributes<WorkUnit>> = {};

    if (clusterId) where.clusterId = String(clusterId);
    if (state) where.state = { [Op.in]: String(state).split(',') };
    if (owner) where.owner = { [Op.like]: `%${owner}%` };
    if (jobName) where.jobName = { [Op.like]: `%${jobName}%` };
    if (dateFrom || dateTo) {
      where.workUnitTimestamp = {
        ...(dateFrom ? { [Op.gte]: new Date(String(dateFrom)) } : {}),
        ...(dateTo ? { [Op.lte]: new Date(String(dateTo)) } : {}),
      };
    }
    if (costAbove) {
      where.totalCost = { [Op.gt]: parseFloat(String(costAbove)) };
    }
    if (req.query.detailsFetched !== undefined) {
      if (req.query.detailsFetched === 'true') {
        where.detailsFetchedAt = { [Op.ne]: null };
      } else if (req.query.detailsFetched === 'false') {
        where.detailsFetchedAt = null;
      }
    }

    const [{ count, rows }, aggregateRows] = await Promise.all([
      WorkUnit.findAndCountAll({
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
        order: [[String(sort), String(order)]],
        limit: parseInt(String(limit)),
        offset,
        raw: true,
      }),
      WorkUnit.findAll({
        where,
        attributes: [
          [sequelize.fn('SUM', sequelize.col('totalCost')), 'totalCost'],
          [
            sequelize.fn('AVG', sequelize.col('totalClusterTime')),
            'avgClusterTime',
          ],
        ],
        raw: true,
      }),
    ]);

    const rawAgg = aggregateRows[0] as unknown as WorkUnitAggregate | undefined;
    const agg: WorkUnitAggregate = rawAgg ?? {
      totalCost: null,
      avgClusterTime: null,
    };

    return sendSuccess(res, {
      total: count,
      page: parseInt(String(page)),
      limit: parseInt(String(limit)),
      data: rows,
      totalCost: agg.totalCost != null ? parseFloat(agg.totalCost) : 0,
      avgClusterTime:
        agg.avgClusterTime != null ? parseFloat(agg.avgClusterTime) : 0,
    });
  } catch (err) {
    logger.error('Get workunits error: ', err);
    return sendError(res, 'Failed to fetch workunits', 500);
  }
}

async function getWorkunit(req: Request, res: Response) {
  try {
    const { wuid, clusterId } = req.params as {
      wuid: string;
      clusterId: string;
    };
    const wu = await WorkUnit.findOne({
      where: { wuId: wuid, clusterId },
      attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
    });

    if (!wu) return sendError(res, 'Workunit not found', 404);

    return sendSuccess(res, wu.get({ plain: true }));
  } catch (err) {
    logger.error('Get workunit error: ', err);
    return sendError(res, 'Server error', 500);
  }
}

async function getWorkunitDetails(req: Request, res: Response) {
  try {
    const { wuid, clusterId } = req.params as {
      wuid: string;
      clusterId: string;
    };
    const details = await WorkUnitDetails.findAll({
      where: { wuId: wuid, clusterId },
      order: [['id', 'ASC']],
    });

    if (details.length === 0) {
      return sendError(res, 'No details found for this workunit', 404);
    }

    const graphs = buildScopeHierarchy(details);

    return sendSuccess(res, {
      wuId: wuid,
      clusterId,
      fetchedAt: details[0].createdAt || new Date(),
      graphs,
    });
  } catch (err) {
    logger.error('Get workunit details error: ', err);
    return sendError(res, 'Failed to fetch details', 500);
  }
}

async function getWorkunitHotspots(req: Request, res: Response) {
  try {
    const limit = parseInt(String(req.query.limit || '15'));
    const { wuid, clusterId } = req.params as {
      wuid: string;
      clusterId: string;
    };

    const details = await WorkUnitDetails.findAll({
      where: { wuId: wuid, clusterId },
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

async function getWorkunitTimeline(req: Request, res: Response) {
  try {
    const { wuid, clusterId } = req.params as {
      wuid: string;
      clusterId: string;
    };
    const details = await WorkUnitDetails.findAll({
      where: { wuId: wuid, clusterId },
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

async function getJobHistoryByJobName(req: Request, res: Response) {
  try {
    const { clusterId, jobName } = req.params as {
      clusterId: string;
      jobName: string;
    };
    // Fetch larger candidate set before fuzzy matching to avoid missing similar jobs
    // that aren't in the most recent N workunits
    const { limit = 500 } = req.query;

    // Build where clause
    const where: WhereOptions<InferAttributes<WorkUnit>> = {
      clusterId,
    };

    const wus = await WorkUnit.findAll({
      where,
      order: [['workUnitTimestamp', 'DESC']], // Most recent first
      limit: parseInt(String(limit)),
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
      raw: true,
    });

    // Using enhanced fuzzy matching with substring intelligence
    const MIN_SIMILARITY = 0.8; // 80% similar (adjust between 0.7-0.9)

    const fuzzyResults = findFuzzyMatches(
      jobName,
      wus.filter(w => w.jobName),
      w => w.jobName,
      { minSimilarity: MIN_SIMILARITY }
    );

    const similarJobs = fuzzyResults.map(result => ({
      ...result.item,
      similarity: result.similarity,
      distance: result.distance,
      matchType: result.matchType,
    }));

    // Return empty array for no matches (not a 404) - client handles empty state gracefully
    return sendSuccess(res, similarJobs);
  } catch (error) {
    logger.error('Error fetching job history:', error);
    return sendError(res, 'Failed to fetch job history', 500);
  }
}

async function getJobHistoryByJobNameWStats(req: Request, res: Response) {
  try {
    const { clusterId, jobName } = req.params as {
      clusterId: string;
      jobName: string;
    };
    const { startDate } = req.query;

    const where: WhereOptions<InferAttributes<WorkUnit>> = {
      clusterId,
      jobName,
    };

    if (startDate) {
      where.workUnitTimestamp = {
        [Op.gte]: new Date(String(startDate)),
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

async function comparePreviousByWuid(req: Request, res: Response) {
  try {
    const { clusterId, wuid } = req.params as {
      clusterId: string;
      wuid: string;
    };

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

/**
 * Proxy WUDetails to the HPCC cluster and return normalised IScope[] for
 * the client-side MetricGraph renderer (Graph tab on workunit detail page).
 */
async function getWorkunitGraph(req: Request, res: Response) {
  const { clusterId, wuid } = req.params as { clusterId: string; wuid: string };

  try {
    const cluster = await getCluster(clusterId);
    const { hash, username, allowSelfSigned, thor_host, thor_port } = cluster;

    const opts = getClusterOptions(
      {
        baseUrl: `${thor_host}:${thor_port}`,
        userID: username ?? '',
        password: hash ?? '',
      },
      allowSelfSigned
    );

    const wu = Workunit.attach(opts, wuid);

    const { data } = await wu.fetchDetailsNormalized({
      ScopeFilter: {
        MaxDepth: 999999,
        ScopeTypes: [
          'graph',
          'subgraph',
          'child',
          'activity',
          'operation',
          'edge',
          'workflow',
        ],
      },
      NestedFilter: { Depth: 999999, ScopeTypes: [] },
      PropertiesToReturn: {
        AllScopes: true,
        AllAttributes: true,
        AllProperties: true,
        AllStatistics: true,
        AllHints: true,
        AllNotes: true,
      },
      ScopeOptions: {
        IncludeId: true,
        IncludeScope: true,
        IncludeScopeType: true,
        IncludeMatchedScopesInResults: true,
      },
      PropertyOptions: {
        IncludeName: true,
        IncludeRawValue: true,
        IncludeFormatted: true,
        IncludeMeasure: true,
        IncludeCreator: false,
        IncludeCreatorType: false,
      },
    });

    return sendSuccess(res, data);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to fetch workunit graph';
    logger.error('getWorkunitGraph error:', err);

    // Surface cluster-unreachable errors with a friendlier status
    const status =
      message.toLowerCase().includes('not reachable') ||
      message.toLowerCase().includes('cannot open workunit')
        ? 503
        : 500;

    return sendError(res, message, status);
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
  getWorkunitGraph,
};
