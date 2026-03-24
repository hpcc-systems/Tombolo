import type { WhereClauseRow } from './utils';

export const DEFAULT_SQL = '-- Enter your SQL query here\nSELECT * FROM work_unit_details LIMIT 10';

export const WHERE_OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'NOT LIKE', 'IN', 'IS NULL', 'IS NOT NULL'];

export const INITIAL_WHERE_ROW = (): WhereClauseRow => ({
  id: Date.now(),
  column: '',
  operator: '=',
  value: '',
});

export const SQL_FORMATTER_OPTIONS = {
  language: 'mysql' as const,
  tabWidth: 2,
  keywordCase: 'upper' as const,
};

export const QUERY_TIMEOUT_MS = 120000;
export const MAX_HISTORY_ITEMS = 20;

export const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl/Cmd + Enter', description: 'Execute' },
  { keys: 'Ctrl/Cmd + S', description: 'Save Query' },
  { keys: 'Ctrl/Cmd + /', description: 'Comment Line' },
  { keys: 'Ctrl/Cmd + K', description: 'Format SQL' },
];
