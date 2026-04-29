import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { getReadOnlySequelize } from '@tombolo/db';
import { sendSuccess, sendError } from '../utils/response.js';
import logger from '../config/logger.js';
import { activityKindLabels } from '@tombolo/shared';
import axios from 'axios';
import { getProviderConfig } from '../config/aiModels.js';
import type { Select } from 'node-sql-parser';
import {
  applyScopeToSelect,
  collectReferencedTables,
  enforceRowLimit,
  getOutputToSourceColumnMapFromAst,
  parseAndValidateAnalyticsSql,
  sqlifySelect,
} from '../utils/workunitAnalyticsSqlAst.js';
import {
  ALLOWED_WORKUNIT_ANALYTICS_TABLES,
  ALLOWED_WORKUNIT_ANALYTICS_TABLE_SET,
  SCOPEABLE_WORKUNIT_ANALYTICS_TABLES,
  SCOPEABLE_WORKUNIT_ANALYTICS_TABLE_SET,
  SENSITIVE_WORKUNIT_ANALYTICS_CLUSTER_COLUMN_SET,
} from '../config/workunitAnalyticsPolicy.js';

const readOnlySequelize = getReadOnlySequelize();

const ACTIVITY_KIND_SOURCE_COLUMNS = new Set(['kind']);

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

type ColumnSortFamily =
  | 'number'
  | 'date'
  | 'datetime'
  | 'time'
  | 'boolean'
  | 'string'
  | 'json'
  | 'unknown';

interface ColumnTypeMetadata {
  family: ColumnSortFamily;
  rawType: string | null;
}

function normalizeColumnFamily(rawType: string | null): ColumnSortFamily {
  if (!rawType) return 'unknown';
  const type = rawType.toLowerCase();

  if (
    [
      'int',
      'integer',
      'tinyint',
      'smallint',
      'mediumint',
      'bigint',
      'decimal',
      'numeric',
      'float',
      'double',
      'real',
      'bit',
      'year',
    ].includes(type)
  ) {
    return 'number';
  }

  if (type === 'date') return 'date';
  if (['datetime', 'timestamp'].includes(type)) return 'datetime';
  if (type === 'time') return 'time';
  if (['bool', 'boolean'].includes(type)) return 'boolean';
  if (type === 'json') return 'json';

  if (
    [
      'char',
      'varchar',
      'text',
      'tinytext',
      'mediumtext',
      'longtext',
      'enum',
      'set',
      'binary',
      'varbinary',
      'blob',
      'tinyblob',
      'mediumblob',
      'longblob',
    ].includes(type)
  ) {
    return 'string';
  }

  return 'unknown';
}

function inferFamilyFromValues(
  rows: Record<string, unknown>[],
  columnName: string
): ColumnSortFamily {
  const observedValues = rows
    .map(row => row[columnName])
    .filter(value => value !== null && value !== undefined)
    .slice(0, 100);

  if (observedValues.length === 0) {
    return 'unknown';
  }

  if (
    observedValues.every(
      value =>
        typeof value === 'object' &&
        value !== null &&
        !(value instanceof Date) &&
        !Array.isArray(value)
    )
  ) {
    return 'json';
  }

  if (observedValues.every(value => typeof value === 'boolean')) {
    return 'boolean';
  }

  const normalizedStrings = observedValues
    .map(value => String(value).trim().toLowerCase())
    .filter(value => value !== '');

  if (
    normalizedStrings.length > 0 &&
    normalizedStrings.every(value =>
      ['0', '1', 'true', 'false', 'yes', 'no'].includes(value)
    )
  ) {
    return 'boolean';
  }

  if (
    observedValues.every(value => {
      if (typeof value === 'number') return Number.isFinite(value);
      if (typeof value === 'bigint') return true;
      if (typeof value === 'string' && value.trim() !== '') {
        const numeric = Number(value);
        return Number.isFinite(numeric);
      }
      return false;
    })
  ) {
    return 'number';
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const dateTimePattern =
    /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;
  const timePattern = /^\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

  if (
    observedValues.every(value => {
      if (value instanceof Date) return true;
      if (typeof value !== 'string') return false;
      const trimmed = value.trim();
      return (
        dateTimePattern.test(trimmed) || !Number.isNaN(Date.parse(trimmed))
      );
    })
  ) {
    if (
      observedValues.every(
        value => typeof value === 'string' && datePattern.test(value.trim())
      )
    ) {
      return 'date';
    }

    if (
      observedValues.every(
        value => typeof value === 'string' && timePattern.test(value.trim())
      )
    ) {
      return 'time';
    }

    if (
      observedValues.some(
        value => typeof value === 'string' && dateTimePattern.test(value.trim())
      )
    ) {
      return 'datetime';
    }

    return 'date';
  }

  return 'string';
}

async function fetchTableColumnTypes(
  tableNames: string[]
): Promise<Record<string, Set<string>>> {
  const typeLookup: Record<string, Set<string>> = {};

  for (const tableName of tableNames) {
    const columns = (await readOnlySequelize.query(
      `
        SELECT c.COLUMN_NAME as name, c.DATA_TYPE as type
        FROM INFORMATION_SCHEMA.COLUMNS c
        WHERE c.TABLE_SCHEMA = DATABASE()
          AND c.TABLE_NAME = ?
      `,
      {
        replacements: [tableName],
        type: QueryTypes.SELECT,
      }
    )) as Array<{ name: string; type: string }>;

    for (const column of columns) {
      const normalized = column.name.toLowerCase();
      if (!typeLookup[normalized]) {
        typeLookup[normalized] = new Set();
      }
      typeLookup[normalized].add(column.type);
    }
  }

  return typeLookup;
}

async function buildColumnTypeMetadata(
  queryAst: Select,
  columns: string[],
  rows: Record<string, unknown>[]
): Promise<Record<string, ColumnTypeMetadata>> {
  const outputToSourceColumnMap = getOutputToSourceColumnMapFromAst(queryAst);
  const referencedTables = collectReferencedTables(queryAst);
  const tableColumnTypeLookup = await fetchTableColumnTypes(referencedTables);
  const columnTypes: Record<string, ColumnTypeMetadata> = {};

  for (const column of columns) {
    const outputColumn = column.toLowerCase();
    const sourceColumn = outputToSourceColumnMap[outputColumn] || outputColumn;
    const candidateTypes = tableColumnTypeLookup[sourceColumn]
      ? Array.from(tableColumnTypeLookup[sourceColumn])
      : [];

    const rawType = candidateTypes.length === 1 ? candidateTypes[0] : null;
    const normalizedFamily = normalizeColumnFamily(rawType);
    const family =
      normalizedFamily === 'unknown'
        ? inferFamilyFromValues(rows, column)
        : normalizedFamily;

    columnTypes[column] = {
      family,
      rawType,
    };
  }

  return columnTypes;
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
    userId: req.user?.id,
    scopeToWuid: null,
    scopeToClusterId: null,
  };

  try {
    const inputSql =
      typeof req.body.sql === 'string' ? req.body.sql.trim() : '';
    const parsedSqlContext =
      req.analyticsSqlContext || parseAndValidateAnalyticsSql(inputSql);
    req.analyticsSqlContext = parsedSqlContext;

    const hadTrailingSemicolon = parsedSqlContext.hadTrailingSemicolon;
    const rawSql = parsedSqlContext.normalizedSql;
    const finalSelectAst = JSON.parse(
      JSON.stringify(parsedSqlContext.ast)
    ) as Select;

    options = req.body.options || {};
    const isScopedQuery = Boolean(
      options.scopeToWuid || options.scopeToClusterId
    );
    querySource = isScopedQuery ? 'scoped-workunit-sql' : 'analytics-page-sql';
    logContext = {
      source: querySource,
      userId: req.user?.id,
      scopeToWuid: options.scopeToWuid || null,
      scopeToClusterId: options.scopeToClusterId || null,
    };

    logger.info('Analytics SQL query started', {
      ...logContext,
      requestedLimit: options.limit || 1000,
      sql: rawSql,
    });

    const scopeApplied = applyScopeToSelect(finalSelectAst, {
      scopeToWuid: options.scopeToWuid,
      scopeToClusterId: options.scopeToClusterId,
      scopeableTableSet: SCOPEABLE_WORKUNIT_ANALYTICS_TABLE_SET,
    });

    if (scopeApplied) {
      logger.debug('Applied AST-based scoping to query', {
        original: rawSql,
        scoped: sqlifySelect(finalSelectAst),
        options,
      });
    }

    // Enforce row limit (already validated to be <= 5000)
    const MAX_LIMIT = options.limit || 1000;
    enforceRowLimit(finalSelectAst, MAX_LIMIT);

    let finalSql = sqlifySelect(finalSelectAst);

    // Preserve a single trailing semicolon if the original query had one.
    if (hadTrailingSemicolon) {
      finalSql = `${finalSql.replace(/;\s*$/, '')};`;
    }

    // Use a transaction to pin both the CONNECTION_ID() query and the user query to the
    // same MySQL thread. This is the idiomatic Sequelize way to guarantee same-connection
    // execution — the transaction is never committed since we only run SELECTs.
    const t = await readOnlySequelize.transaction();

    let connectionId: number | null = null;
    try {
      // Retrieve the MySQL connection ID for this thread so we can cancel it if needed.
      const connIdRows = (await readOnlySequelize.query(
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
        readOnlySequelize
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
      rows = (await readOnlySequelize.query(finalSql, {
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
    const outputToSourceColumnMap =
      getOutputToSourceColumnMapFromAst(finalSelectAst);
    const activityKindMappingStats = mapActivityKindIdsInRows(
      rows,
      outputToSourceColumnMap
    );

    // Extract column names
    const columns =
      Array.isArray(rows) && rows.length > 0 ? Object.keys(rows[0]) : [];
    const columnTypes = await buildColumnTypeMetadata(
      finalSelectAst,
      columns,
      rows
    );

    const unresolvedColumns = Object.entries(columnTypes)
      .filter(([, metadata]) => metadata.rawType === null)
      .map(([columnName]) => columnName);

    logger.debug('Analytics SQL query column type metadata', {
      ...logContext,
      columnCount: columns.length,
      unresolvedTypeColumns: unresolvedColumns,
      unresolvedTypeCount: unresolvedColumns.length,
      activityKindMappingStats,
    });

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
      columnTypes,
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
 * Get scoped database schema information (scopeable tables only)
 */
async function getScopedSchema(req: Request, res: Response) {
  try {
    const tableName = req.query.tableName as string | undefined;

    if (tableName) {
      const normalizedTableName = tableName.toLowerCase();
      if (!SCOPEABLE_WORKUNIT_ANALYTICS_TABLE_SET.has(normalizedTableName)) {
        return sendError(
          res,
          `Invalid table name for scoped schema. Allowed: ${SCOPEABLE_WORKUNIT_ANALYTICS_TABLES.join(', ')}`,
          400
        );
      }

      const columns = await readOnlySequelize.query(
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
          replacements: [normalizedTableName],
          type: QueryTypes.SELECT,
        }
      );

      return sendSuccess(res, columns);
    }

    const allSchemas: Record<string, SchemaColumnRow[]> = {};

    for (const table of SCOPEABLE_WORKUNIT_ANALYTICS_TABLES) {
      const columns = await readOnlySequelize.query(
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

      allSchemas[table] = columns as SchemaColumnRow[];
    }

    return sendSuccess(res, allSchemas);
  } catch (err) {
    logger.error('Scoped schema fetch error:', err);
    return sendError(res, 'Failed to fetch scoped schema', 500);
  }
}

/**
 * Get database schema information
 */
async function getSchema(req: Request, res: Response) {
  try {
    const tableName = req.query.tableName as string | undefined;

    // If tableName is provided, return just that table's schema
    if (tableName) {
      const normalizedTableName = tableName.toLowerCase();
      if (!ALLOWED_WORKUNIT_ANALYTICS_TABLE_SET.has(normalizedTableName)) {
        return sendError(
          res,
          `Invalid table name. Allowed: ${ALLOWED_WORKUNIT_ANALYTICS_TABLES.join(', ')}`,
          400
        );
      }

      const columns = await readOnlySequelize.query(
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
          replacements: [normalizedTableName],
          type: QueryTypes.SELECT,
        }
      );

      // Filter out sensitive columns from clusters table
      const filteredColumns =
        normalizedTableName === 'clusters'
          ? (columns as SchemaColumnRow[]).filter(
              col =>
                !SENSITIVE_WORKUNIT_ANALYTICS_CLUSTER_COLUMN_SET.has(
                  col.name.toLowerCase()
                )
            )
          : columns;

      return sendSuccess(res, filteredColumns);
    }

    // If no tableName, return all allowed tables with their schemas
    const allSchemas: Record<string, SchemaColumnRow[]> = {};

    for (const table of ALLOWED_WORKUNIT_ANALYTICS_TABLES) {
      const columns = await readOnlySequelize.query(
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
          col =>
            !SENSITIVE_WORKUNIT_ANALYTICS_CLUSTER_COLUMN_SET.has(
              col.name.toLowerCase()
            )
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
 * Get database statistics
 */
async function getDatabaseStats(req: Request, res: Response) {
  try {
    // Get table statistics for both tables
    const [tableStats] = await readOnlySequelize.query(`
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
    const clusterCounts = await readOnlySequelize.query(
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
    const stateCounts = await readOnlySequelize.query(
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
    const [dateRange] = await readOnlySequelize.query(`
      SELECT
        MIN(workUnitTimestamp) as earliest,
        MAX(workUnitTimestamp) as latest
      FROM work_unit_details
    `);

    // Get workunits table stats
    const [workunitStats] = await readOnlySequelize.query(`
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

      const response = await axios.post(url, requestBody, {
        headers: providerConfig.apiKey
          ? { Authorization: `Bearer ${providerConfig.apiKey}` }
          : undefined,
        timeout: 60000,
      });

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
  } catch (err: unknown) {
    const typedErr = err as {
      response?: { data?: { error?: { message?: string } } };
      message?: string;
    };
    logger.error('Analytics assistant error:', err);
    const message =
      typedErr?.response?.data?.error?.message ||
      typedErr?.message ||
      'Failed to generate assistant response';
    return sendError(res, message, 502);
  }
}

export {
  executeAnalyticsQuery,
  getSchema,
  getScopedSchema,
  getDatabaseStats,
  askAnalyticsAssistant,
};
