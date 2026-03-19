import { message } from 'antd';

export interface WhereClauseRow {
  id: number;
  column: string;
  operator: string;
  value: string;
}

export const sanitizeValue = (value: string): string => {
  return value ? value.replace(/;/g, '').trim() : '';
};

export const buildConditionString = (row: WhereClauseRow): string => {
  if (row.operator === 'IS NULL' || row.operator === 'IS NOT NULL') {
    return `${row.column} ${row.operator}`;
  }

  const sanitizedValue = sanitizeValue(row.value);
  if (!sanitizedValue) return `${row.column} ${row.operator} ''`;

  const isNumeric = !isNaN(Number(sanitizedValue)) && sanitizedValue !== '';
  const formattedValue =
    row.operator === 'IN' ? `(${sanitizedValue})` : isNumeric ? sanitizedValue : `'${sanitizedValue}'`;

  return `${row.column} ${row.operator} ${formattedValue}`;
};

export const stripComments = (sql: string): string => {
  return sql.replace(/--.*$/gm, '').trim();
};

export const extractWhereClause = (sql: string): string | null => {
  const strippedSql = stripComments(sql);
  const whereMatch = strippedSql.match(/\bwhere\b(.+?)(?:\b(?:group\s+by|order\s+by|limit|;)\b|$)/is);

  if (!whereMatch || !whereMatch[1].trim()) {
    return null;
  }

  return whereMatch[1].trim().replace(/;+$/, '');
};

export const hasWhereClause = (sql: string): boolean => {
  const strippedSql = stripComments(sql);
  return /\bwhere\b/i.test(strippedSql);
};

export const ensureSpacing = (text: string): string => {
  return text.trim() ? '\n' + text.trim() : '';
};

export const cleanUpSQLFormatting = (sql: string): string => {
  let cleaned = sql;

  cleaned = cleaned.replace(/WHERE\s+AND\s+/gi, 'WHERE ');
  cleaned = cleaned.replace(/\s+AND\s+AND\s+/gi, ' AND ');
  cleaned = cleaned.replace(/\s+AND\s*(\n\s*)?(LIMIT|ORDER BY|GROUP BY)/gi, '\n$2');
  cleaned = cleaned.replace(/WHERE\s*(\n\s*)?(LIMIT|ORDER BY|GROUP BY)/gi, '$2');
  cleaned = cleaned.replace(/\)(LIMIT|ORDER BY|GROUP BY)/gi, ')\n$1');
  cleaned = cleaned.replace(/AND(LIMIT|ORDER BY|GROUP BY)/gi, 'AND\n$1');
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  cleaned = cleaned.replace(/\n\s*\n/g, '\n');

  return cleaned.trim();
};

export const exportToCSV = (columns: string[], rows: Record<string, unknown>[]): void => {
  if (!rows.length) {
    message.warning('No results to export');
    return;
  }

  const headers = columns.join(',');
  const csvRows = rows
    .map(row =>
      columns
        .map(col => {
          const value = row[col];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    )
    .join('\n');

  const csv = `${headers}\n${csvRows}`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `query-results-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  message.success('Results exported to CSV');
};

export const formatTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};
