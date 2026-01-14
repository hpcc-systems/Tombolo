const { Op, QueryTypes } = require('sequelize');
const { WorkUnit, WorkUnitDetails, sequelize } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../config/logger');
const { forbiddenSqlKeywords } = require('@tombolo/shared');

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
    if (req.query.detailsFetched !== undefined) {
      if (req.query.detailsFetched === 'true') {
        where[Op.and] = [
          sequelize.literal(
            'EXISTS(SELECT 1 FROM `work_unit_details` WHERE `work_unit_details`.`wuId` = `WorkUnit`.`wuId` AND `work_unit_details`.`clusterId` = `WorkUnit`.`clusterId`)'
          ),
        ];
      } else if (req.query.detailsFetched === 'false') {
        where[Op.and] = [
          sequelize.literal(
            'NOT EXISTS(SELECT 1 FROM `work_unit_details` WHERE `work_unit_details`.`wuId` = `WorkUnit`.`wuId` AND `work_unit_details`.`clusterId` = `WorkUnit`.`clusterId`)'
          ),
        ];
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
        [
          sequelize.literal(
            'EXISTS(SELECT 1 FROM `work_unit_details` WHERE `work_unit_details`.`wuId` = `WorkUnit`.`wuId` AND `work_unit_details`.`clusterId` = `WorkUnit`.`clusterId`)'
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

async function executeWorkunitSql(req, res) {
  try {
    const { clusterId, wuid } = req.params;
    const rawSql = (req.body.sql || '').trim();

    if (!rawSql) return sendError(res, 'SQL is required', 400);

    // Basic protections
    const lowered = rawSql.toLowerCase();
    if (lowered.includes(';')) {
      return sendError(res, 'Multiple statements are not allowed', 400);
    }
    if (!lowered.startsWith('select')) {
      return sendError(res, 'Only SELECT statements are allowed', 400);
    }

    // Strip comments and check for forbidden keywords
    const withoutComments = rawSql
      .replace(/--[^\n]*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();

    for (const kw of forbiddenSqlKeywords) {
      const re = new RegExp(`\\b${kw}\\b`, 'i');
      if (re.test(withoutComments)) {
        return sendError(res, 'Only non-destructive SELECT queries are allowed', 400);
      }
    }

    // Cap rows returned
    const MAX_LIMIT = 1000;

    // Build safe SQL by forcing FROM work_unit_details and injecting enforced WHERE
    const selectBody = rawSql.replace(/^select\s+/i, '');

    const fromIndex = selectBody.search(/\bfrom\b/i);
    if (fromIndex === -1) {
      return sendError(res, 'Query must include FROM clause', 400);
    }
    const selectList = selectBody.substring(0, fromIndex).trim();
    let remainder = selectBody.substring(fromIndex + 4).trim();

    // Validate base table and capture optional alias
    const tokens = remainder.split(/\s+/);
    const tableToken = tokens[0].replace(/[`\[\]"]/g, '');
    if (tableToken !== 'work_unit_details') {
      return sendError(res, 'You may only query the work_unit_details table', 400);
    }

    tokens.shift();
    if (tokens[0] && tokens[0].toLowerCase() === 'as') tokens.shift();
    const alias = tokens[0] && !['where', 'order', 'group', 'limit', 'join'].includes(tokens[0].toLowerCase()) ? tokens.shift() : 'work_unit_details';

    const rest = tokens.join(' ');

    // Disallow multi-table constructs
    const restLower = rest.toLowerCase();
    if (/(\bjoin\b|\bunion\b|\bfrom\b)/i.test(restLower)) {
      return sendError(res, 'JOINs, UNIONs, and subqueries are not allowed', 400);
    }

    // Merge enforced WHERE with user's WHERE while preserving ORDER/GROUP/LIMIT
    const enforcedWhere = `${alias}.\`clusterId\` = :clusterId AND ${alias}.\`wuId\` = :wuid`;

    let safeWhereJoined = '';
    const restTrimmedAll = rest.trim();
    const whereMatch = restTrimmedAll.match(/\bwhere\b/i);
    if (whereMatch && typeof whereMatch.index === 'number') {
      const whereIdx = whereMatch.index;
      const beforeWhere = restTrimmedAll.substring(0, whereIdx).trim();
      const afterWhereAll = restTrimmedAll.substring(whereIdx + whereMatch[0].length).trim();

      let tailStartIdx = -1;
      const tailMatch = afterWhereAll.match(/\b(order\s+by|group\s+by|limit)\b/i);
      if (tailMatch && typeof tailMatch.index === 'number') {
        tailStartIdx = tailMatch.index;
      }

      const userWhereCond = tailStartIdx >= 0 ? afterWhereAll.substring(0, tailStartIdx).trim() : afterWhereAll;
      const tail = tailStartIdx >= 0 ? afterWhereAll.substring(tailStartIdx).trim() : '';

      const prefix = beforeWhere ? beforeWhere + ' ' : '';
      safeWhereJoined = `${prefix}WHERE (${userWhereCond}) AND (${enforcedWhere})${tail ? ' ' + tail : ''}`;
    } else {
      const restTrimmed = restTrimmedAll;
      safeWhereJoined = restTrimmed ? `WHERE ${enforcedWhere} ${restTrimmed}` : `WHERE ${enforcedWhere}`;
    }

    // Enforce LIMIT cap
    let finalSql = `SELECT ${selectList} FROM \`work_unit_details\` ${alias === 'work_unit_details' ? '' : 'AS ' + alias} ${safeWhereJoined}`.trim();
    const limitMatch = finalSql.toLowerCase().match(/\blimit\s+(\d+)/);
    if (limitMatch) {
      const n = parseInt(limitMatch[1], 10);
      if (!Number.isFinite(n) || n > MAX_LIMIT) {
        finalSql = finalSql.replace(/\blimit\s+\d+/i, `LIMIT ${MAX_LIMIT}`);
      }
    } else {
      finalSql = `${finalSql} LIMIT ${MAX_LIMIT}`;
    }

    const rows = await sequelize.query(finalSql, {
      replacements: { clusterId, wuid },
      type: QueryTypes.SELECT,
      logging: false,
    });

    const columns = Array.isArray(rows) && rows.length ? Object.keys(rows[0]) : [];
    return sendSuccess(res, { columns, rows });
  } catch (err) {
    logger.error('Execute workunit SQL error: ', err);
    const msg = err?.parent?.sqlMessage || err?.message || 'Failed to execute SQL';
    return sendError(res, msg, 400);
  }
}

module.exports = {
  getWorkunits,
  getWorkunit,
  getWorkunitDetails,
  getWorkunitHotspots,
  getWorkunitTimeline,
  executeWorkunitSql,
};
