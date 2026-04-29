import nodeSqlParser from 'node-sql-parser';
import type { AST, Binary, ColumnRefItem, From, Select } from 'node-sql-parser';

const { Parser } = nodeSqlParser;
const parser = new Parser();
const MYSQL_PARSER_OPTIONS = { database: 'mysql' as const };
const SQL_EDITOR_PLACEHOLDER = '-- enter your sql query here';

export interface ParsedAnalyticsSql {
  originalSql: string;
  normalizedSql: string;
  hadTrailingSemicolon: boolean;
  ast: Select;
}

export interface AnalyticsScopeOptions {
  scopeToWuid?: string;
  scopeToClusterId?: string;
  scopeableTableSet?: ReadonlySet<string>;
}

function cloneAstNode<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function asSingleAst(ast: AST[] | AST): AST {
  if (Array.isArray(ast)) {
    if (ast.length !== 1) {
      throw new Error('Multiple statements are not allowed');
    }
    return ast[0];
  }

  return ast;
}

function assertSelectAst(ast: AST): Select {
  if (ast.type !== 'select') {
    throw new Error('Only SELECT statements are allowed');
  }

  return ast;
}

function getSqlBody(sql: string): {
  sqlBody: string;
  hadTrailingSemicolon: boolean;
} {
  const originalSql = sql.trim();
  const firstSemicolonIndex = originalSql.indexOf(';');

  if (firstSemicolonIndex === -1) {
    return {
      sqlBody: originalSql,
      hadTrailingSemicolon: false,
    };
  }

  const lastSemicolonIndex = originalSql.lastIndexOf(';');
  const isSingleTrailingSemicolon =
    firstSemicolonIndex === lastSemicolonIndex &&
    firstSemicolonIndex === originalSql.length - 1;

  if (!isSingleTrailingSemicolon) {
    throw new Error('Multiple statements are not allowed');
  }

  return {
    sqlBody: originalSql.slice(0, -1).trim(),
    hadTrailingSemicolon: true,
  };
}

function parseSelectSql(sql: string): Select {
  let astified: AST[] | AST;
  try {
    astified = parser.astify(sql, MYSQL_PARSER_OPTIONS);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Invalid SQL syntax');
  }

  const ast = asSingleAst(astified);
  return assertSelectAst(ast);
}

function stripSqlEditorPlaceholder(sql: string): string {
  return sql
    .split(/\r?\n/)
    .filter(line => line.trim().toLowerCase() !== SQL_EDITOR_PLACEHOLDER)
    .join('\n')
    .trim();
}

export function parseAndValidateAnalyticsSql(sql: string): ParsedAnalyticsSql {
  const originalSql = stripSqlEditorPlaceholder(sql);
  if (!originalSql) {
    throw new Error('sql is required');
  }

  const { sqlBody, hadTrailingSemicolon } = getSqlBody(originalSql);
  if (!sqlBody) {
    throw new Error('sql is required');
  }

  const ast = parseSelectSql(sqlBody);

  return {
    originalSql,
    normalizedSql: sqlBody,
    hadTrailingSemicolon,
    ast,
  };
}

export function getSelectChain(root: Select): Select[] {
  const chain: Select[] = [];
  let current: Select | undefined = root;

  while (current) {
    chain.push(current);
    current = current._next || undefined;
  }

  return chain;
}

function addReferencedTablesFromFromClause(
  fromClause: Select['from'],
  tables: Set<string>
): void {
  if (!fromClause) {
    return;
  }

  const entries = Array.isArray(fromClause) ? fromClause : [fromClause];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const tableName = (entry as From & { table?: string }).table;
    if (typeof tableName === 'string' && tableName.trim() !== '') {
      tables.add(tableName.toLowerCase());
    }

    const nestedAst = (entry as { expr?: { ast?: unknown } }).expr?.ast;
    if (nestedAst && typeof nestedAst === 'object') {
      if (Array.isArray(nestedAst)) {
        for (const nestedEntry of nestedAst) {
          if (nestedEntry && typeof nestedEntry === 'object') {
            const nestedSelect = nestedEntry as AST;
            if (nestedSelect.type === 'select') {
              addReferencedTablesFromSelect(nestedSelect, tables);
            }
          }
        }
      } else {
        const nestedSelect = nestedAst as AST;
        if (nestedSelect.type === 'select') {
          addReferencedTablesFromSelect(nestedSelect, tables);
        }
      }
    }
  }
}

function addReferencedTablesFromSelect(selectAst: Select, tables: Set<string>) {
  addReferencedTablesFromFromClause(selectAst.from, tables);
  if (selectAst._next) {
    addReferencedTablesFromSelect(selectAst._next, tables);
  }
}

export function collectReferencedTables(selectAst: Select): string[] {
  const tables = new Set<string>();
  addReferencedTablesFromSelect(selectAst, tables);
  return Array.from(tables);
}

function collectColumnRefs(node: unknown, refs: ColumnRefItem[]): void {
  if (node === null || node === undefined) {
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectColumnRefs(item, refs);
    }
    return;
  }

  if (typeof node !== 'object') {
    return;
  }

  const candidate = node as { type?: string };
  if (candidate.type === 'column_ref') {
    refs.push(node as ColumnRefItem);
  }

  for (const value of Object.values(node)) {
    collectColumnRefs(value, refs);
  }
}

function getAliasToTableMap(selectAst: Select): Map<string, string> {
  const aliasToTable = new Map<string, string>();
  const fromClause = selectAst.from;
  const entries = !fromClause
    ? []
    : Array.isArray(fromClause)
      ? fromClause
      : [fromClause];

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const tableName = (entry as From & { table?: string }).table;
    const aliasName = (entry as From & { as?: string | null }).as;

    if (typeof tableName !== 'string' || tableName.trim() === '') {
      continue;
    }

    const normalizedTable = tableName.toLowerCase();
    aliasToTable.set(normalizedTable, normalizedTable);

    if (typeof aliasName === 'string' && aliasName.trim() !== '') {
      aliasToTable.set(aliasName.toLowerCase(), normalizedTable);
    }
  }

  return aliasToTable;
}

function isClusterReference(
  tableRef: string | null,
  aliasToTable: Map<string, string>,
  includesClustersTable: boolean
): boolean {
  if (!tableRef) {
    return includesClustersTable;
  }

  const normalized = tableRef.toLowerCase();
  return aliasToTable.get(normalized) === 'clusters';
}

function isTopLevelClustersWildcard(
  expression: unknown,
  aliasToTable: Map<string, string>,
  includesClustersTable: boolean
): boolean {
  if (!expression || typeof expression !== 'object') {
    return false;
  }

  const candidate = expression as {
    type?: string;
    table?: string | null;
    column?: string | { expr?: unknown };
  };

  if (candidate.type !== 'column_ref' || candidate.column !== '*') {
    return false;
  }

  return isClusterReference(
    typeof candidate.table === 'string' ? candidate.table : null,
    aliasToTable,
    includesClustersTable
  );
}

export function findSensitiveClusterColumnViolation(
  rootSelect: Select,
  sensitiveColumns: readonly string[]
): string | null {
  const blockedColumns = new Set(
    sensitiveColumns.map(col => col.toLowerCase())
  );

  for (const selectAst of getSelectChain(rootSelect)) {
    const aliasToTable = getAliasToTableMap(selectAst);
    const includesClustersTable = Array.from(aliasToTable.values()).includes(
      'clusters'
    );

    if (!includesClustersTable) {
      continue;
    }

    const selectedColumns = Array.isArray(selectAst.columns)
      ? selectAst.columns
      : [];

    for (const selectedColumn of selectedColumns) {
      const expr = (selectedColumn as { expr?: unknown }).expr;
      if (
        isTopLevelClustersWildcard(expr, aliasToTable, includesClustersTable)
      ) {
        return '*';
      }

      const refs: ColumnRefItem[] = [];
      collectColumnRefs(expr, refs);

      for (const ref of refs) {
        if (
          !isClusterReference(ref.table, aliasToTable, includesClustersTable)
        ) {
          continue;
        }

        const columnName =
          typeof ref.column === 'string' ? ref.column.toLowerCase() : null;

        if (columnName && blockedColumns.has(columnName)) {
          return columnName;
        }
      }
    }
  }

  return null;
}

function getAliasValue(alias: unknown): string | null {
  if (!alias) {
    return null;
  }

  if (typeof alias === 'string') {
    return alias;
  }

  if (typeof alias === 'object' && 'value' in alias) {
    const value = (alias as { value?: unknown }).value;
    return typeof value === 'string' ? value : null;
  }

  return null;
}

function appendScopedEquals(
  conditions: Binary[],
  qualifier: string | null,
  column: 'wuId' | 'clusterId',
  value: string
): void {
  conditions.push({
    type: 'binary_expr',
    operator: '=',
    left: {
      type: 'column_ref',
      table: qualifier,
      column,
    },
    right: {
      type: 'single_quote_string',
      value,
    },
  });
}

function getInitialScopedQualifierForSelect(
  selectAst: Select,
  scopeableTableSet?: ReadonlySet<string>
): string | null {
  const fromClause = selectAst.from;
  const entries = !fromClause
    ? []
    : Array.isArray(fromClause)
      ? fromClause
      : [fromClause];

  const initialEntry = entries[0];
  if (!initialEntry || typeof initialEntry !== 'object') {
    return null;
  }

  const tableName = (initialEntry as From & { table?: string }).table;
  if (typeof tableName !== 'string' || tableName.trim() === '') {
    return null;
  }

  const normalizedTableName = tableName.toLowerCase();
  if (scopeableTableSet && !scopeableTableSet.has(normalizedTableName)) {
    return null;
  }

  const alias = getAliasValue((initialEntry as From & { as?: unknown }).as);
  const qualifier = (alias || tableName).trim();
  return qualifier || null;
}

function reduceConditions(conditions: Binary[]): Binary | null {
  if (conditions.length === 0) {
    return null;
  }

  return conditions.slice(1).reduce<Binary>(
    (combined, current) => ({
      type: 'binary_expr',
      operator: 'AND',
      left: combined,
      right: current,
    }),
    conditions[0]
  );
}

function buildScopeFilterForSelect(
  selectAst: Select,
  options: AnalyticsScopeOptions
): Binary | null {
  const conditions: Binary[] = [];
  const qualifier = getInitialScopedQualifierForSelect(
    selectAst,
    options.scopeableTableSet
  );

  if (qualifier) {
    if (options.scopeToWuid) {
      appendScopedEquals(conditions, qualifier, 'wuId', options.scopeToWuid);
    }

    if (options.scopeToClusterId) {
      appendScopedEquals(
        conditions,
        qualifier,
        'clusterId',
        options.scopeToClusterId
      );
    }

    return reduceConditions(conditions);
  }

  // Backward-compatible fallback for legacy calls that do not pass a scopeable table set.
  if (!options.scopeableTableSet) {
    if (options.scopeToWuid) {
      appendScopedEquals(conditions, null, 'wuId', options.scopeToWuid);
    }

    if (options.scopeToClusterId) {
      appendScopedEquals(
        conditions,
        null,
        'clusterId',
        options.scopeToClusterId
      );
    }
  }

  return reduceConditions(conditions);
}

export function applyScopeToSelect(
  rootSelect: Select,
  options: AnalyticsScopeOptions
): boolean {
  let scopeApplied = false;

  for (const selectAst of getSelectChain(rootSelect)) {
    const scopeFilter = buildScopeFilterForSelect(selectAst, options);
    if (!scopeFilter) {
      continue;
    }

    scopeApplied = true;
    const nextWhere = cloneAstNode(scopeFilter);
    if (!selectAst.where) {
      selectAst.where = nextWhere;
      continue;
    }

    selectAst.where = {
      type: 'binary_expr',
      operator: 'AND',
      left: nextWhere,
      right: selectAst.where,
    };
  }

  return scopeApplied;
}

export function enforceRowLimit(rootSelect: Select, maxLimit: number): void {
  if (!Number.isFinite(maxLimit) || maxLimit <= 0) {
    return;
  }

  if (!rootSelect.limit || !Array.isArray(rootSelect.limit.value)) {
    rootSelect.limit = {
      seperator: '',
      value: [{ type: 'number', value: maxLimit }],
    };
    return;
  }

  const currentValues = rootSelect.limit.value;
  if (currentValues.length === 0) {
    rootSelect.limit.value = [{ type: 'number', value: maxLimit }];
    return;
  }

  const countIndex = currentValues.length > 1 ? 1 : 0;
  const currentCount = Number(currentValues[countIndex]?.value);

  if (Number.isFinite(currentCount) && currentCount <= maxLimit) {
    return;
  }

  currentValues[countIndex] = {
    type: 'number',
    value: maxLimit,
  };
}

export function getOutputToSourceColumnMapFromAst(
  rootSelect: Select
): Record<string, string> {
  const map: Record<string, string> = {};
  const selectedColumns = Array.isArray(rootSelect.columns)
    ? rootSelect.columns
    : [];

  for (const selectedColumn of selectedColumns) {
    const expr = (selectedColumn as { expr?: unknown }).expr;
    if (!expr || typeof expr !== 'object') {
      continue;
    }

    const columnRef = expr as {
      type?: string;
      column?: string | { expr?: unknown };
    };

    if (
      columnRef.type !== 'column_ref' ||
      typeof columnRef.column !== 'string'
    ) {
      continue;
    }

    const sourceColumn = columnRef.column.toLowerCase();
    if (sourceColumn === '*') {
      continue;
    }

    const alias = getAliasValue((selectedColumn as { as?: unknown }).as);
    const outputColumn = (alias || columnRef.column).toLowerCase();
    map[outputColumn] = sourceColumn;
  }

  return map;
}

export function sqlifySelect(selectAst: Select): string {
  return parser.sqlify(selectAst, MYSQL_PARSER_OPTIONS);
}
