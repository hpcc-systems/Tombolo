import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@tombolo/db';
import { sendSuccess, sendError } from '../utils/response.js';
import logger from '../config/logger.js';
import { activityKindLabels } from '@tombolo/shared';
import axios from 'axios';
import { getProviderConfig } from '../config/aiModels.js';

const ACTIVITY_KIND_SOURCE_COLUMNS = new Set(['kind']);

function splitSelectClause(selectClause: string): string[] {
  const expressions: string[] = [];
  let current = '';
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;

  for (let i = 0; i < selectClause.length; i += 1) {
    const ch = selectClause[i];
    const prev = i > 0 ? selectClause[i - 1] : '';

    if (ch === "'" && !inDoubleQuote && !inBacktick && prev !== '\\') {
      inSingleQuote = !inSingleQuote;
    } else if (ch === '"' && !inSingleQuote && !inBacktick && prev !== '\\') {
      inDoubleQuote = !inDoubleQuote;
    } else if (ch === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
    }

    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (ch === '(') depth += 1;
      if (ch === ')' && depth > 0) depth -= 1;
    }

    if (
      ch === ',' &&
      depth === 0 &&
      !inSingleQuote &&
      !inDoubleQuote &&
      !inBacktick
    ) {
      if (current.trim()) expressions.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.trim()) expressions.push(current.trim());
  return expressions;
}

function parseColumnProjection(expression: string): {
  outputColumn: string | null;
  sourceColumn: string | null;
} {
  const asAliasMatch = expression.match(
    /\s+AS\s+`?([a-zA-Z_][a-zA-Z0-9_]*)`?\s*$/i
  );
  const tailAliasMatch = expression.match(
    /\s+`?([a-zA-Z_][a-zA-Z0-9_]*)`?\s*$/
  );

  let alias: string | null = null;
  let baseExpr = expression;

  if (asAliasMatch) {
    alias = asAliasMatch[1];
    baseExpr = expression.slice(0, asAliasMatch.index).trim();
  } else if (tailAliasMatch) {
    const potentialExpr = expression.slice(0, tailAliasMatch.index).trim();
    if (potentialExpr && /[)\].`"'0-9a-zA-Z_]$/.test(potentialExpr)) {
      alias = tailAliasMatch[1];
      baseExpr = potentialExpr;
    }
  }

  const sourceMatch = baseExpr.match(
    /^(?:`?[a-zA-Z_][a-zA-Z0-9_]*`?\.)?`?([a-zA-Z_][a-zA-Z0-9_]*)`?$/
  );

  if (!sourceMatch) {
    return { outputColumn: alias, sourceColumn: null };
  }

  const sourceColumn = sourceMatch[1];
  return { outputColumn: alias || sourceColumn, sourceColumn };
}

function getOutputToSourceColumnMap(sql: string): Record<string, string> {
  const cleanSql = sql.replace(/;\s*$/, '').trim();
  const selectMatch = cleanSql.match(/^\s*SELECT\s+([\s\S]+?)\s+FROM\s+/i);
  if (!selectMatch) return {};

  const selectClause = selectMatch[1].replace(/^DISTINCT\s+/i, '').trim();
  if (!selectClause || selectClause === '*') return {};

  const map: Record<string, string> = {};
  const projections = splitSelectClause(selectClause);

  for (const projection of projections) {
    const { outputColumn, sourceColumn } = parseColumnProjection(projection);
    if (!outputColumn || !sourceColumn) continue;

    map[outputColumn.toLowerCase()] = sourceColumn.toLowerCase();
  }

  return map;
}

function mapActivityKindIdsInRows(
  rows: Record<string, unknown>[],
  outputToSourceColumnMap: Record<string, string>
): {
  mappedRows: number;
  mappedCells: number;
  kindOutputColumns: string[];
  aliasMapSize: number;
} {
  const mappedOutputColumns = new Set(
    Object.entries(outputToSourceColumnMap)
      .filter(([, sourceColumn]) =>
        ACTIVITY_KIND_SOURCE_COLUMNS.has(sourceColumn.toLowerCase())
      )
      .map(([outputColumn]) => outputColumn.toLowerCase())
  );

  const explicitKindColumns = new Set<string>();
  let mappedCells = 0;
  let mappedRows = 0;

  for (const row of rows) {
    let rowMapped = false;
    for (const [columnName, value] of Object.entries(row)) {
      const normalizedColumnName = columnName.toLowerCase();
      const sourceColumn = outputToSourceColumnMap[normalizedColumnName];
      const isMappedFromKind =
        sourceColumn !== undefined
          ? ACTIVITY_KIND_SOURCE_COLUMNS.has(sourceColumn.toLowerCase())
          : ACTIVITY_KIND_SOURCE_COLUMNS.has(normalizedColumnName);

      if (!isMappedFromKind && !mappedOutputColumns.has(normalizedColumnName)) {
        continue;
      }

      explicitKindColumns.add(columnName);

      const kindId =
        typeof value === 'number'
          ? value
          : typeof value === 'bigint' &&
              value >= BigInt(Number.MIN_SAFE_INTEGER) &&
              value <= BigInt(Number.MAX_SAFE_INTEGER)
            ? Number(value)
            : typeof value === 'string' &&
                value.trim() !== '' &&
                !Number.isNaN(Number(value))
              ? Number(value)
              : null;

      if (
        kindId !== null &&
        Number.isInteger(kindId) &&
        kindId >= 0 &&
        kindId < activityKindLabels.length
      ) {
        row[columnName] = `${activityKindLabels[kindId]} (${kindId})`;
        mappedCells += 1;
        rowMapped = true;
      }
    }

    if (rowMapped) {
      mappedRows += 1;
    }
  }

  return {
    mappedRows,
    mappedCells,
    kindOutputColumns: Array.from(explicitKindColumns),
    aliasMapSize: Object.keys(outputToSourceColumnMap).length,
  };
}

interface SchemaColumnRow {
  name: string;
  type: string;
  nullable: string;
  key: string;
  description: string;
  ORDINAL_POSITION: number;
  keyType: 'PRI' | 'FK' | 'MUL' | null;
}

function extractSqlFromText(text: string): string | null {
  const fencedMatch = text.match(/```sql\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const selectMatch = text.match(/\bselect\b[\s\S]*?(?=(?:\n\n|$))/i);
  return selectMatch?.[0]?.trim() || null;
}

function stripSqlFences(text: string): string {
  return text.replace(/```sql\s*[\s\S]*?```/gi, '').trim();
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

function extractJsonFromFences(text: string): string {
  // Try to extract from ```json fences (Ollama wraps JSON this way)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (jsonMatch?.[1]) {
    return jsonMatch[1].trim();
  }
  // Also try generic ``` fences containing {
  const genericMatch = text.match(/```\s*([\s\S]*?)```/i);
  if (genericMatch?.[1] && genericMatch[1].trim().startsWith('{')) {
    return genericMatch[1].trim();
  }

  const withoutSpecialTokens = text.replace(/<\|[^|>]+\|>/g, ' ').trim();
  return extractFirstJsonObject(withoutSpecialTokens) || withoutSpecialTokens;
}

/**
 * Execute a general analytics SQL query
 * Unlike the workunit-scoped query, this allows querying across all data
 * but still enforces read-only SELECT queries
 *
 * Note: SQL validation is now handled by middleware (analyticsMiddleware.js)
 * This function receives pre-validated SQL
 */
async function executeAnalyticsQuery(req: Request, res: Response) {
  let isCancelled = false;
  let onClose: (() => void) | null = null;
  const requestStartedAt = Date.now();
  let queryExecutionStartedAt: number | null = null;
  let options: {
    scopeToWuid?: string;
    scopeToClusterId?: string;
    limit?: number;
  } = {};
  let querySource: 'scoped-workunit-sql' | 'analytics-page-sql' =
    'analytics-page-sql';
  let logContext: {
    source: 'scoped-workunit-sql' | 'analytics-page-sql';
    userId?: string;
    scopeToWuid: string | null;
    scopeToClusterId: string | null;
  } = {
    source: querySource,
    userId: (req as Request & { user?: { id?: string } }).user?.id,
    scopeToWuid: null,
    scopeToClusterId: null,
  };

  try {
    // SQL and options are already validated by middleware
    const inputSql = req.body.sql.trim();
    const hadTrailingSemicolon = /;\s*$/.test(inputSql);
    const rawSql = inputSql.replace(/;\s*$/, '');
    options = req.body.options || {};
    const isScopedQuery = Boolean(
      options.scopeToWuid || options.scopeToClusterId
    );
    querySource = isScopedQuery ? 'scoped-workunit-sql' : 'analytics-page-sql';
    logContext = {
      source: querySource,
      userId: (req as Request & { user?: { id?: string } }).user?.id,
      scopeToWuid: options.scopeToWuid || null,
      scopeToClusterId: options.scopeToClusterId || null,
    };

    logger.info('Analytics SQL query started', {
      ...logContext,
      requestedLimit: options.limit || 1000,
      sql: rawSql,
    });

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

    // Preserve a single trailing semicolon if the original query had one.
    if (hadTrailingSemicolon) {
      finalSql = `${finalSql.replace(/;\s*$/, '')};`;
    }

    // Use a transaction to pin both the CONNECTION_ID() query and the user query to the
    // same MySQL thread. This is the idiomatic Sequelize way to guarantee same-connection
    // execution — the transaction is never committed since we only run SELECTs.
    const t = await sequelize.transaction();

    let connectionId: number | null = null;
    try {
      // Retrieve the MySQL connection ID for this thread so we can cancel it if needed.
      const connIdRows = (await sequelize.query(
        'SELECT CONNECTION_ID() AS id',
        {
          type: QueryTypes.SELECT,
          transaction: t,
        }
      )) as Array<{ id: number }>;
      connectionId = connIdRows[0]?.id ?? null;
    } catch {
      // CONNECTION_ID can fail on some connection states; cancellation is best-effort.
    }

    // Always attach a close listener so isCancelled is set regardless of whether
    // CONNECTION_ID() was available. This prevents writing to a closed socket even
    // when KILL QUERY cannot be issued.
    onClose = () => {
      isCancelled = true;
      const now = Date.now();
      const cancelledAtTotalMs = now - requestStartedAt;
      const cancelledAtExecutionMs =
        queryExecutionStartedAt === null ? null : now - queryExecutionStartedAt;

      logger.info('Analytics SQL query cancelled by client', {
        ...logContext,
        cancelledAtExecutionMs,
        cancelledAtTotalMs,
      });

      // Only issue KILL QUERY when we have the connection ID.
      if (connectionId !== null) {
        sequelize
          .query(`KILL QUERY ${connectionId}`)
          .then(() => {
            // best-effort cancellation
          })
          .catch(() => {
            // ER_NO_SUCH_THREAD (1094) fires when the query already finished — safe to ignore.
          });
      }
    };
    res.on('close', onClose);

    // Execute the query on the same pinned connection via the transaction.
    queryExecutionStartedAt = Date.now();
    const startTime = Date.now();

    let rows: Record<string, unknown>[];
    try {
      rows = (await sequelize.query(finalSql, {
        type: QueryTypes.SELECT,
        transaction: t,
      })) as Record<string, unknown>[];
    } finally {
      // Always roll back — we only did SELECTs so this is a no-op on data, but it
      // releases the connection back to the pool.
      try {
        await t.rollback();
      } catch {
        // rollback may fail if connection was already terminated
      }
    }

    // Remove the close listener — query completed before the client disconnected.
    if (onClose) res.off('close', onClose);

    // If the client disconnected mid-query, avoid writing to a closed response.
    if (isCancelled) return;

    const executionTime = Date.now() - startTime;
    const totalResponseTimeMs = Date.now() - requestStartedAt;

    // Replace activity kind ids with backend-owned labels before sending to clients.
    const outputToSourceColumnMap = getOutputToSourceColumnMap(finalSql);
    const activityKindMappingStats = mapActivityKindIdsInRows(
      rows,
      outputToSourceColumnMap
    );

    // Extract column names
    const columns =
      Array.isArray(rows) && rows.length > 0 ? Object.keys(rows[0]) : [];

    logger.info('Analytics SQL query completed', {
      ...logContext,
      rowCount: rows.length,
      executionTimeMs: executionTime,
      totalResponseTimeMs,
    });

    return sendSuccess(res, {
      columns,
      rows,
      executionTime,
      rowCount: rows.length,
      limited: rows.length === MAX_LIMIT,
    });
  } catch (err) {
    if (onClose) res.off('close', onClose);

    if (isCancelled) {
      // Query was killed because the client disconnected — not an error worth logging.
      return;
    }

    logger.error('Analytics query execution error:', {
      ...logContext,
      elapsedMs: Date.now() - requestStartedAt,
      err,
    });

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
          ? (columns as SchemaColumnRow[]).filter(
              col => !sensitiveColumns.includes(col.name.toLowerCase())
            )
          : columns;

      return sendSuccess(res, filteredColumns);
    }

    // If no tableName, return all allowed tables with their schemas
    const allSchemas: Record<string, SchemaColumnRow[]> = {};
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
        allSchemas[table] = (columns as SchemaColumnRow[]).filter(
          col => !sensitiveColumns.includes(col.name.toLowerCase())
        );
      } else {
        allSchemas[table] = columns as SchemaColumnRow[];
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

/**
 * NL -> SQL and schema Q&A assistant powered by configurable AI providers
 */
async function askAnalyticsAssistant(req: Request, res: Response) {
  try {
    const message = String(req.body.message || '').trim();
    const assistantContext = String(req.body.assistantContext || '');
    const knowledgeBase = String(req.body.knowledgeBase || '');

    // Resolve provider config from unified config file
    const requestedProvider = String(
      req.body.provider || 'openai'
    ).toLowerCase();
    const requestedModel = String(req.body.model || '').trim();
    const providerConfig = getProviderConfig(requestedProvider);

    if (!providerConfig) {
      return sendError(res, `Unknown provider: ${requestedProvider}`, 400);
    }

    // Filter schema to only essential fields: name, type, keyType (for FK relationships)
    const rawSchemaData = req.body.schemaData || {};
    const schemaData: Record<string, unknown[]> = {};
    for (const table of Object.keys(rawSchemaData)) {
      schemaData[table] = (rawSchemaData[table] || []).map(
        (col: Record<string, unknown>) => ({
          name: col.name,
          type: col.type,
          ...(col.keyType && { keyType: col.keyType }),
        })
      );
    }

    // For gpt4all: keep only column names (drop types) to minimise token usage
    const schemaForPrompt =
      requestedProvider === 'gpt4all'
        ? Object.fromEntries(
            Object.entries(schemaData).map(([table, cols]) => [
              table,
              (cols as Array<{ name: unknown }>).map(c => c.name),
            ])
          )
        : schemaData;

    // Sanitised conversation history from the client
    const rawHistory: Array<{ role: string; content: string }> = Array.isArray(
      req.body.conversationHistory
    )
      ? req.body.conversationHistory
      : [];
    const conversationHistory = rawHistory
      .filter(
        m =>
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string'
      )
      .slice(requestedProvider === 'gpt4all' ? -3 : -20) // cap turns to keep tokens bounded
      .map(m => ({
        role: m.role,
        content:
          requestedProvider === 'gpt4all' ? m.content.slice(0, 300) : m.content,
      }));

    const prompt = [
      'You are a SQL analytics assistant.',
      'Respond naturally and concisely for normal questions.',
      'Only generate SQL when the user asks for SQL/query generation.',
      'When the user asks to explain or diagnose an existing statement, explain it in plain language.',
      'For explanation or diagnostic answers, do not quote, restate, or include SQL syntax in content.',
      'If the provided statement has an issue and you can correct it, put the corrected statement in sql and keep content plain language.',
      'If Context includes a "Reference SQL to use for this reply", use that exact statement for follow-up questions.',
      'Do not switch to another statement unless the user explicitly asks for a new one.',
      'If SQL is generated: only single SELECT, no semicolon, no DML/DDL.',
      'Use only known tables/columns/relationships from schema and KB below.',
      'If user asks unknown table/column, respond exactly: OUT_OF_SCOPE: Requested table/column is not in KB',
      'If join path is unknown, respond exactly: OUT_OF_SCOPE: Relationship not defined in KB',
      '',
      ...(requestedProvider === 'gpt4all'
        ? []
        : ['Knowledge Base:', knowledgeBase || '(none)', '']),
      'Runtime Schema:',
      JSON.stringify(schemaForPrompt),
      '',
      '',
      assistantContext ? `Context: ${assistantContext}` : '',
      `User request: ${message}`,
      '',
      'Return JSON with shape: {"content":"string","sql":"string|null"}',
    ]
      .filter(Boolean)
      .join('\n');

    const parseResponse = (rawText: string) => {
      let parsed: { content?: string; sql?: string | null } | null = null;
      try {
        const unwrapped = extractJsonFromFences(rawText);
        parsed = JSON.parse(unwrapped);
      } catch {
        parsed = null;
      }

      const content =
        parsed?.content ||
        (typeof rawText === 'string'
          ? stripSqlFences(rawText)
          : 'I could not parse response.');
      const sqlCandidate = parsed?.sql || extractSqlFromText(rawText);

      return {
        content,
        sql: sqlCandidate || null,
      };
    };

    const askOpenAi = async () => {
      if (!providerConfig.apiKey) {
        throw new Error(
          'OpenAI is not configured. Set OPENAI_API_KEY on the server.'
        );
      }

      const response = await axios.post(
        `${providerConfig.endpoint.replace(/\/$/, '')}/chat/completions`,
        {
          model: requestedModel,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are precise, safe, and schema-grounded. Never hallucinate schema.',
            },
            ...conversationHistory,
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${providerConfig.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const rawText =
        response?.data?.choices?.[0]?.message?.content ||
        'I could not generate a response right now.';

      return {
        ...parseResponse(rawText),
        provider: 'openai' as const,
      };
    };

    const askOllama = async () => {
      const response = await axios.post(
        `${providerConfig.endpoint.replace(/\/$/, '')}/api/chat`,
        {
          model: requestedModel,
          stream: false,
          options: { temperature: 0.1 },
          messages: [
            {
              role: 'system',
              content:
                'You are precise, safe, and schema-grounded. Never hallucinate schema. Return valid JSON with keys content and sql.',
            },
            ...conversationHistory,
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        { timeout: 30000 }
      );

      const rawText =
        response?.data?.message?.content ||
        response?.data?.response ||
        'I could not generate a response right now.';

      return {
        ...parseResponse(String(rawText)),
        provider: 'ollama' as const,
      };
    };

    /** Generic OpenAI-compatible handler (LM Studio, GPT4All, etc.) */
    const askOpenAiCompat = async () => {
      const url = `${providerConfig.endpoint.replace(/\/$/, '')}/chat/completions`;
      const requestBody = {
        model: requestedModel,
        temperature: requestedProvider === 'gpt4all' ? 0 : 0.1,
        ...(requestedProvider === 'gpt4all' && { max_tokens: 512 }),
        messages: [
          {
            role: 'system',
            content:
              'You are precise, safe, and schema-grounded. Never hallucinate schema. Return valid JSON with keys content and sql.',
          },
          ...(requestedProvider === 'gpt4all' ? [] : conversationHistory),
          {
            role: 'user',
            content: prompt,
          },
        ],
      };

      let response;
      try {
        response = await axios.post(url, requestBody, {
          headers: providerConfig.apiKey
            ? { Authorization: `Bearer ${providerConfig.apiKey}` }
            : undefined,
          timeout: 60000,
        });
      } catch (error: unknown) {
        throw error;
      }

      const rawContent: string =
        response?.data?.choices?.[0]?.message?.content ||
        'I could not generate a response right now.';
      // Strip DeepSeek-R1 <think>...</think> reasoning blocks
      const rawText = rawContent
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .trim();
      return {
        ...parseResponse(rawText),
        provider: requestedProvider as 'lmstudio' | 'gpt4all',
      };
    };

    let result;
    if (requestedProvider === 'openai') {
      result = await askOpenAi();
    } else if (requestedProvider === 'ollama') {
      result = await askOllama();
    } else if (providerConfig.openAiCompat) {
      result = await askOpenAiCompat();
    } else {
      return sendError(
        res,
        `Provider '${requestedProvider}' is not supported.`,
        400
      );
    }

    return sendSuccess(res, result);
  } catch (err: any) {
    logger.error('Analytics assistant error:', err);
    const message =
      err?.response?.data?.error?.message ||
      err?.message ||
      'Failed to generate assistant response';
    return sendError(res, message, 502);
  }
}

export {
  executeAnalyticsQuery,
  getSchema,
  analyzeQuery,
  getDatabaseStats,
  askAnalyticsAssistant,
};
