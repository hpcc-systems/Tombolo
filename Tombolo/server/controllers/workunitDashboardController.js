import { sequelize } from '@tombolo/db';
import { QueryTypes } from 'sequelize';
import { sendSuccess, sendError } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Get dashboard data with aggregations
 * @route GET /api/workunit-dashboard
 * @param {Object} req.query.startDate - ISO date string (required)
 * @param {Object} req.query.endDate - ISO date string (required)
 * @param {Object} req.query.clusterId - UUID (optional)
 */
async function getDashboardData(req, res) {
  try {
    const { startDate, endDate, clusterId = null } = req.query;

    logger.debug(
      `Fetching dashboard data: ${startDate} to ${endDate}, cluster: ${clusterId || 'all'}`
    );

    // Execute all queries in parallel for efficiency
    const [
      summaryResult,
      dailyCostsResult,
      clusterBreakdownResult,
      ownerBreakdownResult,
      problematicJobsResult,
      workunitsResult,
    ] = await Promise.all([
      // 1. Summary Stats Query
      sequelize.query(
        `
        SELECT 
          COALESCE(SUM(totalCost), 0) as totalCost,
          COUNT(*) as totalJobs,
          COALESCE(AVG(totalCost), 0) as avgCostPerJob,
          COALESCE(SUM(totalClusterTime), 0) as totalCpuHours,
          SUM(CASE WHEN state = 'failed' THEN 1 ELSE 0 END) as failedCount,
          COALESCE(SUM(CASE WHEN state = 'failed' THEN totalCost ELSE 0 END), 0) as failedCost
        FROM work_units
        WHERE workUnitTimestamp BETWEEN :startDate AND :endDate
          AND (:clusterId IS NULL OR clusterId = :clusterId)
          AND deletedAt IS NULL
        `,
        {
          replacements: { startDate, endDate, clusterId },
          type: QueryTypes.SELECT,
        }
      ),

      // 2. Daily Costs Query
      sequelize.query(
        `
        SELECT 
          DATE(workUnitTimestamp) as date,
          COALESCE(SUM(totalCost), 0) as cost
        FROM work_units
        WHERE workUnitTimestamp BETWEEN :startDate AND :endDate
          AND (:clusterId IS NULL OR clusterId = :clusterId)
          AND deletedAt IS NULL
        GROUP BY DATE(workUnitTimestamp)
        ORDER BY date ASC
        `,
        {
          replacements: { startDate, endDate, clusterId },
          type: QueryTypes.SELECT,
        }
      ),

      // 3. Cluster Breakdown Query
      sequelize.query(
        `
        SELECT 
          c.name as cluster,
          COALESCE(SUM(wu.totalCost), 0) as cost,
          COUNT(*) as count
        FROM work_units wu
        INNER JOIN clusters c ON wu.clusterId = c.id
        WHERE wu.workUnitTimestamp BETWEEN :startDate AND :endDate
          AND (:clusterId IS NULL OR wu.clusterId = :clusterId)
          AND wu.deletedAt IS NULL
        GROUP BY wu.clusterId, c.name
        ORDER BY cost DESC
        `,
        {
          replacements: { startDate, endDate, clusterId },
          type: QueryTypes.SELECT,
        }
      ),

      // 4. Owner Breakdown Query
      sequelize.query(
        `
        SELECT 
          owner,
          COALESCE(SUM(totalCost), 0) as cost,
          COUNT(*) as count
        FROM work_units
        WHERE workUnitTimestamp BETWEEN :startDate AND :endDate
          AND (:clusterId IS NULL OR clusterId = :clusterId)
          AND deletedAt IS NULL
        GROUP BY owner
        ORDER BY cost DESC
        LIMIT 10
        `,
        {
          replacements: { startDate, endDate, clusterId },
          type: QueryTypes.SELECT,
        }
      ),

      // 5. Problematic Jobs Query
      sequelize.query(
        `
        (
          SELECT 
            wu.wuId as wuid,
            wu.jobName,
            'Failed job' as issue,
            'critical' as severity,
            wu.totalCost as cost,
            wu.owner,
            c.name as cluster
          FROM work_units wu
          INNER JOIN clusters c ON wu.clusterId = c.id
          WHERE wu.workUnitTimestamp BETWEEN :startDate AND :endDate
            AND (:clusterId IS NULL OR wu.clusterId = :clusterId)
            AND wu.state = 'failed'
            AND wu.deletedAt IS NULL
        )
        UNION ALL
        (
          SELECT 
            wu.wuId as wuid,
            wu.jobName,
            CONCAT('Running for ', ROUND(wu.totalClusterTime, 1), ' hours') as issue,
            'warning' as severity,
            wu.totalCost as cost,
            wu.owner,
            c.name as cluster
          FROM work_units wu
          INNER JOIN clusters c ON wu.clusterId = c.id
          WHERE wu.workUnitTimestamp BETWEEN :startDate AND :endDate
            AND (:clusterId IS NULL OR wu.clusterId = :clusterId)
            AND wu.state = 'running'
            AND wu.totalClusterTime > 5
            AND wu.deletedAt IS NULL
        )
        UNION ALL
        (
          SELECT 
            wu.wuId as wuid,
            wu.jobName,
            'Job blocked — awaiting resources' as issue,
            'info' as severity,
            wu.totalCost as cost,
            wu.owner,
            c.name as cluster
          FROM work_units wu
          INNER JOIN clusters c ON wu.clusterId = c.id
          WHERE wu.workUnitTimestamp BETWEEN :startDate AND :endDate
            AND (:clusterId IS NULL OR wu.clusterId = :clusterId)
            AND wu.state = 'blocked'
            AND wu.deletedAt IS NULL
        )
        ORDER BY 
          CASE severity 
            WHEN 'critical' THEN 1 
            WHEN 'warning' THEN 2 
            WHEN 'info' THEN 3 
          END,
          cost DESC
        LIMIT 8
        `,
        {
          replacements: { startDate, endDate, clusterId },
          type: QueryTypes.SELECT,
        }
      ),

      // 6. Workunits List Query (paginated)
      sequelize.query(
        `
        SELECT 
          wu.wuId as wuid,
          wu.jobName,
          c.name as cluster,
          wu.owner,
          wu.state,
          wu.totalCost as cost,
          wu.totalClusterTime as cpuHours,
          wu.totalClusterTime * 60 as duration,
          DATE_ADD(wu.workUnitTimestamp, INTERVAL wu.totalClusterTime HOUR) as endTime,
          wu.executeCost,
          wu.fileAccessCost,
          wu.compileCost
        FROM work_units wu
        INNER JOIN clusters c ON wu.clusterId = c.id
        WHERE wu.workUnitTimestamp BETWEEN :startDate AND :endDate
          AND (:clusterId IS NULL OR wu.clusterId = :clusterId)
          AND wu.deletedAt IS NULL
        ORDER BY wu.workUnitTimestamp DESC
        LIMIT 100
        `,
        {
          replacements: { startDate, endDate, clusterId },
          type: QueryTypes.SELECT,
        }
      ),
    ]);

    // Extract results
    const summary = summaryResult[0] || {
      totalCost: 0,
      totalJobs: 0,
      avgCostPerJob: 0,
      totalCpuHours: 0,
      failedCount: 0,
      failedCost: 0,
    };

    const dailyCosts = dailyCostsResult || [];
    const clusterBreakdown = clusterBreakdownResult || [];
    const ownerBreakdown = ownerBreakdownResult || [];
    const problematicJobs = problematicJobsResult || [];

    // TODO: Verify that duration calculation (totalClusterTime * 60) accurately represents job duration
    // Post-process workunits to add costBreakdown structure
    const workunits = (workunitsResult || []).map(wu => ({
      wuid: wu.wuid,
      jobName: wu.jobName,
      cluster: wu.cluster,
      owner: wu.owner,
      state: wu.state,
      cost: parseFloat(wu.cost) || 0,
      cpuHours: parseFloat(wu.cpuHours) || 0,
      duration: parseFloat(wu.duration) || 0,
      endTime: wu.endTime,
      costBreakdown: {
        compute: parseFloat(wu.executeCost) || 0,
        fileAccess: parseFloat(wu.fileAccessCost) || 0,
        compile: parseFloat(wu.compileCost) || 0,
      },
    }));

    // TODO: Add logic to compare jobs to previous executions to detect performance degradation
    // This may require a pre-computed table/view for efficiency

    return sendSuccess(
      res,
      {
        summary: {
          totalCost: parseFloat(summary.totalCost) || 0,
          totalJobs: parseInt(summary.totalJobs, 10) || 0,
          avgCostPerJob: parseFloat(summary.avgCostPerJob) || 0,
          totalCpuHours: parseFloat(summary.totalCpuHours) || 0,
          failedCount: parseInt(summary.failedCount, 10) || 0,
          failedCost: parseFloat(summary.failedCost) || 0,
        },
        dailyCosts: dailyCosts.map(d => ({
          date: d.date,
          cost: parseFloat(d.cost) || 0,
        })),
        clusterBreakdown: clusterBreakdown.map(c => ({
          cluster: c.cluster,
          cost: parseFloat(c.cost) || 0,
          count: parseInt(c.count, 10) || 0,
        })),
        ownerBreakdown: ownerBreakdown.map(o => ({
          owner: o.owner,
          cost: parseFloat(o.cost) || 0,
          count: parseInt(o.count, 10) || 0,
        })),
        problematicJobs: problematicJobs.map(p => ({
          wuid: p.wuid,
          jobName: p.jobName,
          issue: p.issue,
          severity: p.severity,
          cost: parseFloat(p.cost) || 0,
          owner: p.owner,
          cluster: p.cluster,
        })),
        workunits,
      },
      'Dashboard data retrieved successfully'
    );
  } catch (error) {
    logger.error('Dashboard data error:', error);
    return sendError(res, 'Failed to fetch dashboard data', 500);
  }
}

export { getDashboardData };
