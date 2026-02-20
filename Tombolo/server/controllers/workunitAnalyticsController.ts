import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Execute a general analytics SQL query
 * Unlike the workunit-scoped query, this allows querying across all data
 * but still enforces read-only SELECT queries
 *
 * Note: SQL validation is now handled by middleware (analyticsMiddleware.js)
 * This function receives pre-validated SQL
 */
async function executeAnalyticsQuery(req: Request, res: Response) {
  try {
    // Log the incoming request body for debugging
    logger.debug(
      'Analytics query request body:',
      JSON.stringify(req.body, null, 2)
    );

    // SQL and options are already validated by middleware
    const rawSql = req.body.sql.trim();
    const options = req.body.options || {};

    // Apply automatic scoping if provided
    let scopedSql = rawSql;
    if (options.scopeToWuid || options.scopeToClusterId) {
      // Parse the SQL to add WHERE conditions for scoping
      const lowerSql = rawSql.toLowerCase();

      // Build the scoping conditions
      const scopeConditions = [];
      if (options.scopeToWuid) {
        scopeConditions.push(
          `wuId = '${options.scopeToWuid.replace(/'/g, "''")}'`
        );
      }
      if (options.scopeToClusterId) {
        scopeConditions.push(
          `clusterId = '${options.scopeToClusterId.replace(/'/g, "''")}'`
        );
      }

      const scopeClause = scopeConditions.join(' AND ');

      // Check if query already has a WHERE clause
      const whereIndex = lowerSql.indexOf(' where ');
      if (whereIndex !== -1) {
        // Find where the WHERE clause ends (before ORDER BY, GROUP BY, HAVING, or LIMIT)
        const afterWhereStart = whereIndex + 7; // start after ' where '
        const afterWhereSql = rawSql.substring(afterWhereStart);
        const afterWhereLower = lowerSql.substring(afterWhereStart);

        // Find the first occurrence of ORDER BY, GROUP BY, HAVING, or LIMIT
        // Use word boundaries to prevent ReDoS with repeated whitespace
        const endClausePattern = /\b(?:order\s+by|group\s+by|having|limit)\b/i;
        const endMatch = endClausePattern.exec(afterWhereLower);

        if (endMatch) {
          // Extract just the WHERE conditions (before ORDER BY, etc.)
          const whereConditions = afterWhereSql.substring(0, endMatch.index);
          const restOfQuery = afterWhereSql.substring(endMatch.index);
          const beforeWhere = rawSql.substring(0, whereIndex + 7);
          scopedSql = `${beforeWhere}(${scopeClause}) AND (${whereConditions})${restOfQuery}`;
        } else {
          // No ORDER BY, GROUP BY, HAVING, or LIMIT - WHERE conditions go to end
          const beforeWhere = rawSql.substring(0, whereIndex + 7);
          scopedSql = `${beforeWhere}(${scopeClause}) AND (${afterWhereSql})`;
        }
      } else {
        // Add WHERE clause before ORDER BY, GROUP BY, or LIMIT
        // Use word boundaries to prevent ReDoS with repeated whitespace
        const insertBeforePattern = /\b(?:order\s+by|group\s+by|limit)\b/i;
        const match = insertBeforePattern.exec(rawSql);

        if (match) {
          const insertPos = match.index;
          scopedSql = `${rawSql.substring(0, insertPos)} WHERE ${scopeClause} ${rawSql.substring(insertPos)}`;
        } else {
          // No WHERE, ORDER BY, GROUP BY, or LIMIT - add at the end
          scopedSql = `${rawSql} WHERE ${scopeClause}`;
        }
      }

      logger.debug('Applied scoping to query:', {
        original: rawSql,
        scoped: scopedSql,
        options,
      });
    }

    // Enforce row limit (already validated to be <= 5000)
    const MAX_LIMIT = options.limit || 1000;

    // Check if query already has a LIMIT clause
    let finalSql = scopedSql;
    const limitMatch = finalSql.toLowerCase().match(/\blimit\s+(\d+)/);

    if (limitMatch) {
      const requestedLimit = parseInt(limitMatch[1], 10);
      if (!Number.isFinite(requestedLimit) || requestedLimit > MAX_LIMIT) {
        // Replace with enforced limit
        finalSql = finalSql.replace(/\blimit\s+\d+/i, `LIMIT ${MAX_LIMIT}`);
      }
    } else {
      // Add limit if not present
      finalSql = `${finalSql} LIMIT ${MAX_LIMIT}`;
    }

    // Execute the query
    const startTime = Date.now();

    const rows = await sequelize.query(finalSql, {
      type: QueryTypes.SELECT,
      logging: sql => logger.debug('Analytics query:', sql),
    });

    const executionTime = Date.now() - startTime;

    // Extract column names
    const columns =
      Array.isArray(rows) && rows.length > 0 ? Object.keys(rows[0]) : [];

    return sendSuccess(res, {
      columns,
      rows,
      executionTime,
      rowCount: rows.length,
      limited: rows.length === MAX_LIMIT,
    });
  } catch (err) {
    logger.error('Analytics query execution error:', err);

    // Extract useful error message
    const errorMessage =
      err?.parent?.sqlMessage ||
      err?.original?.sqlMessage ||
      err?.message ||
      'Failed to execute query';

    return sendError(res, errorMessage, 400);
  }
}

/**
 * Get database schema information
 */
async function getSchema(req: Request, res: Response) {
  try {
    const tableName = req.query.tableName as string | undefined;
    const allowedTables = ['work_unit_details', 'work_units', 'clusters'];

    // If tableName is provided, return just that table's schema
    if (tableName) {
      if (!allowedTables.includes(tableName.toLowerCase())) {
        return sendError(
          res,
          `Invalid table name. Allowed: ${allowedTables.join(', ')}`,
          400
        );
      }

      const columns = await sequelize.query(
        `
        SELECT 
          c.COLUMN_NAME as name,
          c.DATA_TYPE as type,
          c.IS_NULLABLE as nullable,
          c.COLUMN_KEY as \`key\`,
          c.COLUMN_COMMENT as description,
          c.ORDINAL_POSITION,
          CASE 
            WHEN c.COLUMN_KEY = 'PRI' THEN 'PRI'
            WHEN MAX(kcu.REFERENCED_TABLE_NAME) IS NOT NULL THEN 'FK'
            WHEN c.COLUMN_KEY = 'MUL' THEN 'MUL'
            ELSE NULL
          END as keyType
        FROM INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
          ON c.TABLE_SCHEMA = kcu.TABLE_SCHEMA 
          AND c.TABLE_NAME = kcu.TABLE_NAME 
          AND c.COLUMN_NAME = kcu.COLUMN_NAME
          AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
        WHERE c.TABLE_SCHEMA = DATABASE()
          AND c.TABLE_NAME = ?
        GROUP BY c.COLUMN_NAME, c.DATA_TYPE, c.IS_NULLABLE, c.COLUMN_KEY, c.COLUMN_COMMENT, c.ORDINAL_POSITION
        ORDER BY c.ORDINAL_POSITION
      `,
        {
          replacements: [tableName],
          type: QueryTypes.SELECT,
        }
      );

      // Filter out sensitive columns from clusters table
      const sensitiveColumns = [
        'username',
        'hash',
        'password',
        'password_hash',
      ];
      const filteredColumns =
        tableName === 'clusters'
          ? columns.filter(
              col => !sensitiveColumns.includes((col as any).name.toLowerCase())
            )
          : columns;

      return sendSuccess(res, filteredColumns);
    }

    // If no tableName, return all allowed tables with their schemas
    const allSchemas = {};
    const sensitiveColumns = ['username', 'hash', 'password', 'password_hash'];

    for (const table of allowedTables) {
      const columns = await sequelize.query(
        `
        SELECT 
          c.COLUMN_NAME as name,
          c.DATA_TYPE as type,
          c.IS_NULLABLE as nullable,
          c.COLUMN_KEY as \`key\`,
          c.COLUMN_COMMENT as description,
          c.ORDINAL_POSITION,
          CASE 
            WHEN c.COLUMN_KEY = 'PRI' THEN 'PRI'
            WHEN MAX(kcu.REFERENCED_TABLE_NAME) IS NOT NULL THEN 'FK'
            WHEN c.COLUMN_KEY = 'MUL' THEN 'MUL'
            ELSE NULL
          END as keyType
        FROM INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
          ON c.TABLE_SCHEMA = kcu.TABLE_SCHEMA 
          AND c.TABLE_NAME = kcu.TABLE_NAME 
          AND c.COLUMN_NAME = kcu.COLUMN_NAME
          AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
        WHERE c.TABLE_SCHEMA = DATABASE()
          AND c.TABLE_NAME = ?
        GROUP BY c.COLUMN_NAME, c.DATA_TYPE, c.IS_NULLABLE, c.COLUMN_KEY, c.COLUMN_COMMENT, c.ORDINAL_POSITION
        ORDER BY c.ORDINAL_POSITION
      `,
        {
          replacements: [table],
          type: QueryTypes.SELECT,
        }
      );

      // Filter out sensitive columns from clusters table
      if (table === 'clusters') {
        allSchemas[table] = columns.filter(
          col => !sensitiveColumns.includes((col as any).name.toLowerCase())
        );
      } else {
        allSchemas[table] = columns;
      }
    }

    return sendSuccess(res, allSchemas);
  } catch (err) {
    logger.error('Schema fetch error:', err);
    return sendError(res, 'Failed to fetch schema', 500);
  }
}

/**
 * Analyze query without executing it
 * Returns estimated execution plan
 */
async function analyzeQuery(req: Request, res: Response) {
  try {
    const rawSql = (req.body.sql || '').trim();

    if (!rawSql) {
      return sendError(res, 'SQL query is required', 400);
    }

    // Run EXPLAIN on the query
    // Note: rawSql is pre-validated by analyticsMiddleware to ensure it's a safe SELECT query
    // This is intentional - the feature allows users to write custom analytics queries
    const [explanation] = await sequelize.query(`EXPLAIN ${rawSql}`, {
      type: QueryTypes.SELECT,
    });

    return sendSuccess(res, {
      plan: explanation,
      analyzed: true,
    });
  } catch (err) {
    logger.error('Query analysis error:', err);
    return sendError(res, err.message || 'Failed to analyze query', 400);
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats(req: Request, res: Response) {
  try {
    // Get table statistics for both tables
    const [tableStats] = await sequelize.query(`
      SELECT 
        table_name,
        table_rows,
        data_length,
        index_length,
        data_length + index_length as total_size
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name IN ('work_unit_details', 'workunits', 'clusters')
    `);

    // Get record count by cluster from work_unit_details
    const clusterCounts = await sequelize.query(
      `
      SELECT 
        clusterId,
        COUNT(*) as count
      FROM work_unit_details
      GROUP BY clusterId
      ORDER BY count DESC
    `,
      { type: QueryTypes.SELECT }
    );

    // Get state distribution from work_unit_details
    const stateCounts = await sequelize.query(
      `
      SELECT 
        state,
        COUNT(*) as count
      FROM work_unit_details
      GROUP BY state
      ORDER BY count DESC
    `,
      { type: QueryTypes.SELECT }
    );

    // Get date range from work_unit_details
    const [dateRange] = await sequelize.query(`
      SELECT 
        MIN(workUnitTimestamp) as earliest,
        MAX(workUnitTimestamp) as latest
      FROM work_unit_details
    `);

    // Get workunits table stats
    const [workunitStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_workunits,
        COUNT(DISTINCT cluster_id) as unique_clusters,
        MIN(createdAt) as earliest_workunit,
        MAX(createdAt) as latest_workunit
      FROM workunits
    `);

    return sendSuccess(res, {
      tables: tableStats || [],
      clusterDistribution: clusterCounts,
      stateDistribution: stateCounts,
      dateRange: dateRange[0] || {},
      workunitSummary: workunitStats[0] || {},
    });
  } catch (err) {
    logger.error('Database stats error:', err);
    return sendError(res, 'Failed to fetch database statistics', 500);
  }
}

export { executeAnalyticsQuery, getSchema, analyzeQuery, getDatabaseStats };
