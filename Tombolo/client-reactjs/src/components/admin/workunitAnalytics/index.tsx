import { useState, useEffect, useRef, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Layout,
  Button,
  Input,
  Table,
  Tooltip,
  Modal,
  Form,
  Tag,
  Space,
  Tree,
  Collapse,
  Empty,
  Typography,
  Card,
  Statistic,
  Select,
  Dropdown,
} from 'antd';
import styles from './workunitAnalytics.module.css';
import {
  PlayCircleOutlined,
  SaveOutlined,
  ClearOutlined,
  DownloadOutlined,
  HistoryOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  TableOutlined,
  FormatPainterOutlined,
  ReloadOutlined,
  PlusOutlined,
  MinusOutlined,
  FilterOutlined,
  StarOutlined,
  StarFilled,
  KeyOutlined,
  LinkOutlined,
  MenuOutlined,
  LineChartOutlined,
  RollbackOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { format } from 'sql-formatter';

import { apiClient } from '@/services/api';
import { LeftPanelIcon, RightPanelIcon } from './PanelIcons';
import { loadLocalStorage, saveLocalStorage } from '@tombolo/shared/browser';
import analyticsFiltersService from '@/services/analyticsFilters.service';
import { handleError, handleSuccess } from '@/components/common/handleResponse';
import QUERY_TEMPLATES from './queryTemplates';
import ChartModal from './ChartModal';

import type { editor as MonacoEditor } from 'monaco-editor';
import {
  DEFAULT_SQL,
  WHERE_OPERATORS,
  INITIAL_WHERE_ROW,
  SQL_FORMATTER_OPTIONS,
  QUERY_TIMEOUT_MS,
  MAX_HISTORY_ITEMS,
} from './constants';
import {
  sanitizeValue,
  buildConditionString,
  stripComments,
  extractWhereClause,
  hasWhereClause as hasWhere,
  ensureSpacing,
  cleanUpSQLFormatting,
  exportToCSV as exportResults,
  formatTime,
} from './utils';
import type { WhereClauseRow } from './utils';
import { T } from 'vitest/dist/chunks/reporters.d.BFLkQcL6.js';

const { Sider, Content } = Layout;
const { Panel } = Collapse;
const { Title, Text, Paragraph } = Typography;

interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  executionTime: number;
  rowCount: number;
}

interface ExecutionStats {
  executionTime: number;
  rowCount: number;
  columnCount: number;
}

interface SavedQuery {
  id: number;
  name: string;
  description: string;
  sql: string;
  createdAt: string;
  favorite: boolean;
}

interface HistoryEntry {
  id: number;
  sql: string;
  timestamp: string;
  executionTime: number;
  rowCount: number;
}

interface SchemaColumn {
  name: string;
  type: string;
  keyType?: string;
  description?: string;
}

type SchemaData = Record<string, SchemaColumn[]>;

interface SavedFilter {
  id: string;
  name: string;
  conditions: string;
  createdAt: string;
}

const AnalyticsWorkspace = () => {
  const history = useHistory();
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  // State management
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryHistory, setQueryHistory] = useState<HistoryEntry[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [variableModalVisible, setVariableModalVisible] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [currentTemplate, setCurrentTemplate] = useState<{ name: string; sql: string } | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<number | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState<boolean>(loadLocalStorage('analytics.leftCollapsed', false));
  const [rightCollapsed, setRightCollapsed] = useState<boolean>(loadLocalStorage('analytics.rightCollapsed', false));
  const [executionStats, setExecutionStats] = useState<ExecutionStats | null>(null);
  const [schemaData, setSchemaData] = useState<SchemaData | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(true);
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterBuilderVisible, setFilterBuilderVisible] = useState(false);
  const [whereClauses, setWhereClauses] = useState<WhereClauseRow[]>([INITIAL_WHERE_ROW()]);
  const [saveFilterFromEditorModalVisible, setSaveFilterFromEditorModalVisible] = useState(false);
  const [extractedFilterConditions, setExtractedFilterConditions] = useState('');
  const [sqlWhenBuilderOpened, setSqlWhenBuilderOpened] = useState('');
  const [appliedFilterIds, setAppliedFilterIds] = useState<string | null>(null);
  const [isQueryExecuted, setIsQueryExecuted] = useState(false);

  const hasWhereClause = useMemo(() => hasWhere(sql), [sql]);

  // Persist sidebar preferences to localStorage
  useEffect(() => {
    saveLocalStorage('analytics.leftCollapsed', leftCollapsed);
  }, [leftCollapsed]);

  useEffect(() => {
    saveLocalStorage('analytics.rightCollapsed', rightCollapsed);
  }, [rightCollapsed]);

  // Load schema from backend on mount
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        setIsLoadingSchema(true);
        const response = await apiClient.get('/workunitAnalytics/schema');
        setSchemaData(response.data);
      } catch (_error) {
        handleError('Failed to load database schema');
      } finally {
        setIsLoadingSchema(false);
      }
    };
    fetchSchema();
  }, []);

  // Load saved queries from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('analytics_saved_queries');
    if (saved) {
      try {
        setSavedQueries(JSON.parse(saved));
      } catch {
        handleError('Failed to load saved queries');
      }
    }

    const storedHistory = localStorage.getItem('analytics_query_history');
    if (storedHistory) {
      try {
        setQueryHistory(JSON.parse(storedHistory));
      } catch {
        handleError('Failed to load query history');
      }
    }

    // Load filters from backend API
    const loadFilters = async () => {
      try {
        const filters = await analyticsFiltersService.getAll();
        // Ensure filters is an array and filter out any invalid items
        const validFilters = Array.isArray(filters) ? filters.filter(f => f && f.id && f.conditions) : [];
        setSavedFilters(validFilters);
      } catch (_error) {
        console.error('Failed to load filters:', _error);
        handleError('Failed to load saved filters');
        setSavedFilters([]); // Ensure it's always an array
      }
    };
    loadFilters();
  }, []);

  // Auto-update SQL editor when filter builder conditions change
  useEffect(() => {
    if (!filterBuilderVisible) return;

    const newConditions = whereClauses.filter(row => row.column).map(row => buildConditionString(row));

    const baseSql = sqlWhenBuilderOpened || sql;
    const strippedSql = stripComments(baseSql);
    const whereMatch = strippedSql.match(/\bwhere\b(.+?)(?:\b(?:group\s+by|order\s+by|limit|;)\b|$)/is);

    if (newConditions.length === 0) {
      // No conditions from filter builder - keep original SQL if it had WHERE
      if (whereMatch) {
        setSql(baseSql);
      } else {
        // Add empty WHERE clause
        const insertMatch = strippedSql.match(/\b(group\s+by|order\s+by|limit)\b/i);
        if (insertMatch && insertMatch.index !== undefined) {
          const beforeInsert = strippedSql.substring(0, insertMatch.index).trim();
          const afterInsert = strippedSql.substring(insertMatch.index);
          setSql(`${beforeInsert}\nWHERE \n${afterInsert}`);
        } else {
          setSql(`${strippedSql}\nWHERE `);
        }
      }
      return;
    }

    const newWhereClause = newConditions.join('\n  AND ');

    if (whereMatch) {
      // Existing WHERE clause - append new conditions with AND
      const existingWhere = whereMatch[1].trim();
      const beforeWhere = strippedSql.substring(0, whereMatch.index! + 5); // +5 for "WHERE"
      const afterMatch = whereMatch.index! + 5 + whereMatch[1].length;
      const afterWhere = strippedSql.substring(afterMatch);

      const spacedAfterWhere = ensureSpacing(afterWhere);
      const updatedSql = `${beforeWhere} ${existingWhere}\n  AND ${newWhereClause}${spacedAfterWhere}`;
      setSql(updatedSql);
    } else {
      // No existing WHERE - add it before GROUP BY/ORDER BY/LIMIT or at end
      const insertMatch = strippedSql.match(/\b(group\s+by|order\s+by|limit)\b/i);
      if (insertMatch && insertMatch.index !== undefined) {
        const beforeInsert = strippedSql.substring(0, insertMatch.index).trim();
        const afterInsert = strippedSql.substring(insertMatch.index);
        setSql(`${beforeInsert}\nWHERE ${newWhereClause}\n${afterInsert}`);
      } else {
        setSql(`${strippedSql}\nWHERE ${newWhereClause}`);
      }
    }
  }, [whereClauses, filterBuilderVisible, sqlWhenBuilderOpened]);

  // Execute SQL query
  const executeQuery = async () => {
    if (!sql.trim()) {
      handleError('Please enter a SQL query');
      return;
    }

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      const result = await apiClient.post(
        '/workunitAnalytics/query',
        {
          sql,
          options: {},
        },
        { timeout: QUERY_TIMEOUT_MS }
      );

      const executionTime = Date.now() - startTime;

      setQueryResults({
        columns: result.data.columns,
        rows: result.data.rows,
        executionTime,
        rowCount: result.data.rows.length,
      });

      setExecutionStats({
        executionTime,
        rowCount: result.data.rows.length,
        columnCount: result.data.columns.length,
      });

      // Add to query history
      const historyEntry: HistoryEntry = {
        id: Date.now(),
        sql: sql.trim(),
        timestamp: new Date().toISOString(),
        executionTime,
        rowCount: result.data.rows.length,
      };

      const newHistory = [historyEntry, ...queryHistory].slice(0, MAX_HISTORY_ITEMS);
      setQueryHistory(newHistory);
      localStorage.setItem('analytics_query_history', JSON.stringify(newHistory));

      // Mark query as executed
      setIsQueryExecuted(true);

      handleSuccess(`Query executed successfully (${formatTime(executionTime)})`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      handleError(err.response?.data?.message || err.message || 'Failed to execute query');
    } finally {
      setIsExecuting(false);
    }
  };

  // Format SQL
  const formatSql = () => {
    try {
      const formatted = format(sql, SQL_FORMATTER_OPTIONS);
      setSql(formatted);
      handleSuccess('SQL formatted successfully');
    } catch {
      handleError('Failed to format SQL');
    }
  };

  // Clear editor
  const clearEditor = () => {
    setSql('');
    setQueryResults(null);
    setExecutionStats(null);
    setAppliedFilterIds(null);
    setIsQueryExecuted(false);
  };

  // Save query
  const saveQuery = (values: { name: string; description?: string }) => {
    const newQuery: SavedQuery = {
      id: Date.now(),
      name: values.name,
      description: values.description || '',
      sql: sql.trim(),
      createdAt: new Date().toISOString(),
      favorite: false,
    };

    const updated = [...savedQueries, newQuery];
    setSavedQueries(updated);
    localStorage.setItem('analytics_saved_queries', JSON.stringify(updated));

    setSaveModalVisible(false);
    handleSuccess('Query saved successfully');
  };

  // Handle save query button click with validation
  const handleSaveQueryClick = () => {
    if (!isQueryExecuted) {
      handleError('Please execute the query to verify it works correctly before saving');
      return;
    }
    setSaveModalVisible(true);
  };

  // Load saved query
  const loadSavedQuery = (query: SavedQuery) => {
    setSql(query.sql);
    setSelectedQuery(query.id);
    setIsQueryExecuted(false);
    handleSuccess(`Loaded query: ${query.name}`);
  };

  // Delete saved query
  const deleteSavedQuery = (queryId: number) => {
    const updated = savedQueries.filter(q => q.id !== queryId);
    setSavedQueries(updated);
    localStorage.setItem('analytics_saved_queries', JSON.stringify(updated));
    handleSuccess('Query deleted');
  };

  // Toggle favorite
  const toggleFavorite = (queryId: number) => {
    const updated = savedQueries.map(q => (q.id === queryId ? { ...q, favorite: !q.favorite } : q));
    setSavedQueries(updated);
    localStorage.setItem('analytics_saved_queries', JSON.stringify(updated));
  };

  // Load template
  const loadTemplate = (template: { name: string; sql: string }) => {
    // Check for variables in template
    const variableMatches = template.sql.match(/\{\{([^}]+)\}\}/g);

    if (variableMatches) {
      // Extract unique variable names
      const variables = [...new Set(variableMatches.map(m => m.slice(2, -2)))];
      setCurrentTemplate(template);
      setTemplateVariables(variables.reduce((acc, v) => ({ ...acc, [v]: '' }), {} as Record<string, string>));
      setVariableModalVisible(true);
    } else {
      setSql(template.sql);
      setIsQueryExecuted(false);
      handleSuccess(`Loaded template: ${template.name}`);
    }
  };

  // Apply template with variables
  const applyTemplateWithVariables = () => {
    if (!currentTemplate) return;
    let finalSql = currentTemplate.sql;
    Object.entries(templateVariables).forEach(([key, value]) => {
      finalSql = finalSql.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    setSql(finalSql);
    setIsQueryExecuted(false);
    setVariableModalVisible(false);
    handleSuccess(`Loaded template: ${currentTemplate.name}`);
  };

  // Load from history
  const loadFromHistory = (historyItem: HistoryEntry) => {
    setSql(historyItem.sql);
    setIsQueryExecuted(false);
    handleSuccess('Query loaded from history');
  };

  // Convert schema data to tree structure
  const schemaTreeData = useMemo(() => {
    if (!schemaData) return [];

    return Object.entries(schemaData).map(([tableName, columns]) => ({
      title: tableName,
      key: tableName,
      icon: <TableOutlined />,
      children: columns.map(col => ({
        title: col.name,
        key: `${tableName}.${col.name}`,
        type: col.type,
        keyType: col.keyType, // 'PRI' for primary key, 'FK' for foreign key, 'MUL' for index
        description: col.description || `Column in ${tableName} table`,
        isLeaf: true,
      })),
    }));
  }, [schemaData]);

  const exportToCSV = () => {
    if (!queryResults || !queryResults.rows.length) {
      return;
    }
    exportResults(queryResults.columns, queryResults.rows);
  };

  const insertColumn = (columnName: string) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const position = editor.getPosition();
      if (!position) return;

      const columnParts = columnName.split('.');
      const actualColumnName = columnParts.length === 2 ? columnParts[1] : columnName;

      editor.executeEdits('', [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text: actualColumnName,
        },
      ]);
      editor.focus();
      handleSuccess(`Inserted: ${actualColumnName}`);
    }
  };

  const deleteFilter = async (id: string) => {
    try {
      await analyticsFiltersService.delete(id);
      // Remove from applied filters if it was applied
      if (appliedFilterIds === id) {
        setAppliedFilterIds(null);
      }
      // Update local state
      const updated = (savedFilters || []).filter(f => f.id !== id);
      setSavedFilters(updated);
      handleSuccess('Filter deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete filter:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete filter';
      handleError(errorMessage);
    }
  };

  const saveFilterFromEditor = () => {
    // Validate that query has been executed
    if (!isQueryExecuted) {
      handleError('Please execute the query to verify it works correctly before saving the filter');
      return;
    }

    const conditions = extractWhereClause(sql);

    if (!conditions) {
      handleError('No WHERE clause found in the query');
      return;
    }

    setExtractedFilterConditions(conditions);
    setSaveFilterFromEditorModalVisible(true);
  };

  const confirmSaveFilterFromEditor = async (values: { name: string }) => {
    try {
      const newFilter = await analyticsFiltersService.create({
        name: values.name,
        conditions: extractedFilterConditions,
      });

      if (!newFilter || typeof newFilter !== 'object') {
        throw new Error('Invalid response from server: filter data is missing');
      }

      const updated = [newFilter, ...(savedFilters || [])];
      setSavedFilters(updated);
      setSaveFilterFromEditorModalVisible(false);
      setExtractedFilterConditions('');
      handleSuccess(`Filter "${newFilter.name}" saved successfully`);
    } catch (error: any) {
      console.error('Failed to save filter:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save filter';
      handleError(errorMessage);
    }
  };

  const updateExistingFilter = async () => {
    if (!appliedFilterIds) return;

    if (!isQueryExecuted) {
      handleError('Please execute the query before saving the filter');
      return;
    }

    const conditions = extractWhereClause(sql);
    if (!conditions) {
      handleError('No WHERE clause found in the query');
      return;
    }

    const appliedFilter = savedFilters?.find(f => f.id === appliedFilterIds);
    if (!appliedFilter) {
      handleError('Applied filter not found');
      return;
    }

    try {
      const updatedFilter = await analyticsFiltersService.update(appliedFilterIds, {
        conditions,
        name: appliedFilter.name,
      });

      // Update local state
      const updated = (savedFilters || []).map(f => (f.id === appliedFilterIds ? updatedFilter : f));
      setSavedFilters(updated);
      handleSuccess(`Updated "${appliedFilter.name}" successfully`);
    } catch (error: any) {
      console.error('Failed to update filter:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update filter';
      handleError(errorMessage);
    }
  };

  const applyFilterToEditor = (filter: SavedFilter) => {
    // Check if there's already an applied filter
    if (appliedFilterIds && appliedFilterIds !== filter.id) {
      handleError('Please recall the currently applied filter before applying a new one');
      return;
    }

    const conditions = sanitizeValue(filter.conditions);
    if (!conditions) {
      handleError('Filter has no conditions');
      return;
    }

    const currentSql = sql.trim();
    const strippedSql = stripComments(currentSql);

    if (!/^select\b/i.test(strippedSql)) {
      handleError('Can only apply a filter to a SELECT statement');
      return;
    }

    const whereMatch = currentSql.match(/\bwhere\b(.+?)(?:\b(?:group\s+by|order\s+by|limit|;)\b|$)/is);

    let newSql: string;

    if (whereMatch) {
      const beforeWhere = currentSql.substring(0, whereMatch.index! + 5);
      const existingWhere = whereMatch[1].trim();
      const afterMatch = whereMatch.index! + 5 + whereMatch[1].length;
      const afterWhere = currentSql.substring(afterMatch);

      const spacedAfterWhere = ensureSpacing(afterWhere);
      newSql = `${beforeWhere} (${conditions})\n  AND ${existingWhere}${spacedAfterWhere}`;
    } else {
      const insertMatch = currentSql.match(/\b(group\s+by|order\s+by|limit)\b/is);
      if (insertMatch && insertMatch.index !== undefined) {
        const beforeInsert = currentSql.substring(0, insertMatch.index).trim();
        const afterInsert = currentSql.substring(insertMatch.index);
        newSql = `${beforeInsert}\nWHERE (${conditions})\n${afterInsert}`;
      } else {
        newSql = `${currentSql}\nWHERE (${conditions})`;
      }
    }

    setSql(newSql);
    setIsQueryExecuted(false);
    setAppliedFilterIds(filter.id);
    handleSuccess(`Applied "${filter.name}" to query`);
  };

  const recallFilterFromEditor = (filter: SavedFilter) => {
    const conditions = sanitizeValue(filter.conditions);
    if (!conditions) {
      handleError('Filter has no conditions');
      return;
    }

    const currentSql = sql.trim();
    const conditionsPattern = `(${conditions})`;

    if (!currentSql.includes(conditionsPattern)) {
      handleError(`Filter "${filter.name}" not found in current query`);
      return;
    }

    let newSql = currentSql.replace(conditionsPattern, '');
    newSql = cleanUpSQLFormatting(newSql);

    setSql(newSql);
    setIsQueryExecuted(false);
    setAppliedFilterIds(null);
    handleSuccess(`Recalled "${filter.name}" from query`);
  };

  // Filter builder helpers
  const addWhereClause = () => {
    setWhereClauses(prev => [...prev, INITIAL_WHERE_ROW()]);
  };

  const removeWhereClause = (id: number) => {
    setWhereClauses(prev => prev.filter(row => row.id !== id));
  };

  const updateWhereClause = (id: number, field: keyof WhereClauseRow, value: string) => {
    setWhereClauses(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        if (field === 'operator' && (value === 'IS NULL' || value === 'IS NOT NULL')) {
          return { ...row, operator: value, value: '' };
        }
        return { ...row, [field]: value };
      })
    );
  };

  // Get operators based on column data type
  const getOperatorsForColumn = (columnName: string): string[] => {
    if (!columnName || !schemaData) return WHERE_OPERATORS;

    // Find the column type from schema
    let columnType = '';
    for (const cols of Object.values(schemaData)) {
      const col = cols.find(c => c.name === columnName);
      if (col) {
        columnType = col.type.toLowerCase();
        break;
      }
    }

    console.info(`Column: ${columnName}, Type: ${columnType}`);

    // Determine if it's numeric or string type
    const isNumeric = /^(int|integer|bigint|smallint|tinyint|decimal|numeric|float|double|real|number)/.test(
      columnType
    );
    const isDate = /^(date|datetime|timestamp|time)/.test(columnType);
    // For strings, match common string types including uuid
    const isString = /^(char|varchar|text|string|enum|uuid|guid)/.test(columnType) || columnType.includes('char');

    if (isNumeric || isDate) {
      return ['=', '!=', '>', '<', '>=', '<=', 'IS NULL', 'IS NOT NULL', 'IN'];
    } else if (isString) {
      return ['=', '!=', 'LIKE', 'NOT LIKE', 'IS NULL', 'IS NOT NULL', 'IN'];
    }

    // Default: assume string type for safety (don't show comparison operators)
    console.info(`Unknown type for ${columnName}, defaulting to string operators`);
    return ['=', '!=', 'LIKE', 'NOT LIKE', 'IS NULL', 'IS NOT NULL', 'IN'];
  };

  // Get available columns excluding already selected ones
  const getAvailableColumns = (currentRowId: number): Record<string, SchemaColumn[]> => {
    if (!schemaData) return {};

    // Get columns already selected in other rows
    const usedColumns = new Set(
      whereClauses.filter(row => row.id !== currentRowId && row.column).map(row => row.column)
    );

    // Filter out used columns from each table
    const availableSchema: Record<string, SchemaColumn[]> = {};
    for (const [table, cols] of Object.entries(schemaData)) {
      const availableCols = cols.filter(col => !usedColumns.has(col.name));
      if (availableCols.length > 0) {
        availableSchema[table] = availableCols;
      }
    }

    return availableSchema;
  };

  // Render query library (left sidebar)
  const renderQueryLibrary = () => (
    <div className={styles.queryLibrary}>
      <div className={styles.sidebarHeader}>
        <Title level={5}>Query Library</Title>
      </div>

      <Collapse accordion defaultActiveKey={[]} ghost className={styles.libraryCollapse}>
        <Panel
          header={
            <div className={styles.panelHeaderWithAction}>
              <Space>
                <StarFilled className={styles.iconStarFilled} />
                <Text strong>
                  Saved Queries
                  <span className={styles.badgeCount}>{savedQueries.length}</span>
                </Text>
              </Space>
            </div>
          }
          key="saved-queries">
          <div className={styles.panelScrollContent}>
            {/* <Button
            type="dashed"
            icon={<FileAddOutlined />}
            block
            onClick={() => setSaveModalVisible(true)}
            style={{ marginBottom: 12 }}>
            Save Current Query
          </Button> */}

            {savedQueries.length === 0 ? (
              <Empty description="No saved queries yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div className={styles.savedQueriesList}>
                {savedQueries
                  .sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0))
                  .map(query => (
                    <Tooltip title={query.description} placement="top" key={query.id}>
                      <div
                        className={`${styles.savedQueryCard} ${selectedQuery === query.id ? styles.selectedQuery : ''}`}
                        onClick={() => loadSavedQuery(query)}>
                        <div className={styles.savedQueryHeader}>
                          <Text ellipsis>{query.name}</Text>
                          <Space>
                            <Tooltip title={query.favorite ? 'Unfavorite' : 'Favorite'} placement="bottom">
                              <Button
                                type="text"
                                size="small"
                                icon={
                                  query.favorite ? <StarFilled className={styles.iconStarFilled} /> : <StarOutlined />
                                }
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleFavorite(query.id);
                                }}
                              />
                            </Tooltip>
                            <Tooltip title="Delete" placement="bottom">
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={e => {
                                  e.stopPropagation();
                                  deleteSavedQuery(query.id);
                                }}
                              />
                            </Tooltip>
                          </Space>
                        </div>
                        {/* {query.description && (
                        <Paragraph ellipsis={{ rows: 2 }} type="secondary" className={styles.textSmall}>
                          {query.description}
                        </Paragraph>
                      )} */}
                        {/* <Text type="secondary" className={styles.textSmall}>
                        {new Date(query.createdAt).toLocaleDateString()}
                      </Text> */}
                      </div>
                    </Tooltip>
                  ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel
          header={
            <div className={styles.panelHeaderWithAction}>
              <Space>
                <FilterOutlined />
                <Text strong>
                  Filters
                  {(savedFilters?.length || 0) > 0 && <span className={styles.badgeCount}>{savedFilters.length}</span>}
                </Text>
              </Space>
              {!filterBuilderVisible && (
                <Tooltip title="Add new filter">
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    className={styles.panelAddBtn}
                    onClick={e => {
                      e.stopPropagation();
                      setSqlWhenBuilderOpened(sql); // Save current SQL
                      setWhereClauses([INITIAL_WHERE_ROW()]);
                      setFilterBuilderVisible(true);
                    }}
                  />
                </Tooltip>
              )}
            </div>
          }
          key="filters">
          <div className={styles.panelScrollContent}>
            {(savedFilters?.length || 0) === 0 ? (
              <Empty description="No saved filters" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div className={styles.savedQueriesList}>
                {savedFilters
                  ?.filter(f => f && f.id && f.conditions)
                  .map(filter => (
                    <Tooltip
                      key={filter.id}
                      title={
                        <Text type="secondary" style={{ color: 'var(--white)' }}>
                          {filter.conditions}
                        </Text>
                      }
                      placement="top">
                      <div
                        className={`${styles.savedQueryCard} ${styles.whereClauseCard} ${
                          appliedFilterIds === filter.id ? styles.selectedQuery : ''
                        }`}>
                        <div className={styles.savedQueryHeader}>
                          <Text ellipsis className={styles.flex1}>
                            {filter.name}
                            {/* {appliedFilterIds === filter.id && (
                              <Tag color="green" style={{ marginLeft: 8 }}>
                                Applied
                              </Tag>
                            )} */}
                          </Text>
                          <Space size={2} className={styles.whereCardActions}>
                            {appliedFilterIds === filter.id ? (
                              <Tooltip title="Recall from editor query" placement="bottom">
                                <Button
                                  type="text"
                                  size="small"
                                  className={styles.recallButton}
                                  icon={<RollbackOutlined className={styles.iconWarning} />}
                                  onClick={e => {
                                    e.stopPropagation();
                                    recallFilterFromEditor(filter);
                                  }}
                                />
                              </Tooltip>
                            ) : (
                              <Tooltip title="Apply to editor query" placement="bottom">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<PlayCircleOutlined className={styles.iconPrimary} />}
                                  onClick={e => {
                                    e.stopPropagation();
                                    applyFilterToEditor(filter);
                                  }}
                                />
                              </Tooltip>
                            )}
                            <Tooltip title="Delete" placement="bottom">
                              <Button
                                type="text"
                                size="small"
                                danger
                                className={styles.deleteButton}
                                icon={<DeleteOutlined />}
                                onClick={e => {
                                  e.stopPropagation();
                                  deleteFilter(filter.id);
                                }}
                              />
                            </Tooltip>
                          </Space>
                        </div>
                      </div>
                    </Tooltip>
                  ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel
          header={
            <div className={styles.panelHeaderWithAction}>
              <Space>
                <FileTextOutlined />
                <Text strong>Templates</Text>
              </Space>
            </div>
          }
          key="templates">
          <div className={styles.panelScrollContent}>
            {Object.entries(QUERY_TEMPLATES).map(([category, templates]) => (
              <div key={category} className={styles.templateCategory}>
                <Text type="secondary" strong className={styles.textRegular}>
                  {category}
                </Text>
                <div className={styles.templateList}>
                  {templates.map((template, idx) => (
                    <Tooltip
                      key={idx}
                      title={
                        <div>
                          <div className={styles.templateDescription}>{template.description}</div>
                          <pre className={styles.templatePreview}>{template.sql.slice(0, 200)}...</pre>
                        </div>
                      }
                      placement="right">
                      <div className={styles.templateCard} onClick={() => loadTemplate(template)}>
                        <Text ellipsis className={styles.textMedium}>
                          {template.name}
                        </Text>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </Collapse>
    </div>
  );

  // Render schema browser (right sidebar)
  const renderSchemaBrowser = () => (
    <div className={styles.schemaBrowser}>
      <div className={styles.sidebarHeader}>
        <Title level={5}>Schema Reference</Title>
      </div>

      <Collapse defaultActiveKey={[]} ghost>
        <Panel
          header={
            <Space>
              <DatabaseOutlined />
              <Text strong>Database Schema</Text>
            </Space>
          }
          key="schema">
          {isLoadingSchema ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading schema...</div>
          ) : schemaTreeData.length > 0 ? (
            <Tree
              showLine
              showIcon
              treeData={schemaTreeData}
              onSelect={(_selectedKeys, { node }: { node: any }) => {
                if (node.isLeaf) {
                  // Pass the full key which includes table name (e.g., "clusters.name")
                  insertColumn(node.key as string);
                }
              }}
              titleRender={(node: any) => (
                <Tooltip
                  title={node.description ? `${node.type ? `${node.type} - ` : ''}${node.description}` : null}
                  placement="right">
                  <span>
                    {node.keyType === 'PRI' && <KeyOutlined className={styles.iconKey} />}
                    {node.keyType === 'FK' && <LinkOutlined className={styles.iconLink} />}
                    {node.keyType === 'MUL' && <MenuOutlined className={styles.iconMenu} />}
                    {node.title}
                    {node.type && (
                      <Tag className={styles.tagSmall} color="blue">
                        {node.type}
                      </Tag>
                    )}
                  </span>
                </Tooltip>
              )}
            />
          ) : (
            <Empty description="No schema data available" />
          )}
        </Panel>

        {executionStats && (
          <Panel
            header={
              <Space>
                <InfoCircleOutlined />
                <Text strong>Query Info</Text>
              </Space>
            }
            key="query-info">
            <Space direction="vertical" className={styles.fullWidth}>
              <Statistic
                title="Execution Time"
                value={executionStats.executionTime}
                suffix="ms"
                prefix={<ClockCircleOutlined />}
              />
              <Statistic title="Rows Returned" value={executionStats.rowCount} prefix={<TableOutlined />} />
              <Statistic title="Columns" value={executionStats.columnCount} prefix={<TableOutlined />} />
            </Space>
          </Panel>
        )}

        <Panel
          header={
            <Space>
              <QuestionCircleOutlined />
              <Text strong>Help</Text>
            </Space>
          }
          key="help">
          <Space direction="vertical" size="small">
            <Text type="secondary" style={{ fontSize: 12 }}>
              <strong>Keyboard Shortcuts:</strong>
            </Text>
            <Text style={{ fontSize: 11 }}>• Ctrl/Cmd + Enter: Execute</Text>
            <Text style={{ fontSize: 11 }}>• Ctrl/Cmd + S: Save Query</Text>
            <Text style={{ fontSize: 11 }}>• Ctrl/Cmd + /: Comment Line</Text>
            <Text style={{ fontSize: 11 }}>• Ctrl/Cmd + K: Format SQL</Text>
          </Space>
        </Panel>
      </Collapse>
    </div>
  );

  // Render results table
  const renderResults = () => {
    if (!queryResults) return null;

    const columns = queryResults.columns.map(col => ({
      title: col,
      dataIndex: col,
      key: col,
      ellipsis: true,
      sorter: (a: Record<string, unknown>, b: Record<string, unknown>) => {
        const aVal = a[col];
        const bVal = b[col];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return aVal - bVal;
        }
        return String(aVal).localeCompare(String(bVal));
      },
      render: (text: unknown, record: Record<string, unknown>) => {
        // If column is wuId, make it clickable
        if (col === 'wuId' && record.clusterId) {
          return (
            <Button
              type="link"
              size="small"
              onClick={() => history.push(`/workunits/history/${record.clusterId}/${text}`)}>
              {String(text)}
            </Button>
          );
        }
        return String(text ?? '');
      },
    }));

    return (
      <div className={styles.queryResults}>
        <div className={styles.resultsHeader}>
          <Space>
            <Text strong>Results</Text>
            <Tag color="blue">
              {queryResults.rowCount} row{queryResults.rowCount !== 1 ? 's' : ''}
            </Tag>
            <Tag color="green">{queryResults.executionTime}ms</Tag>
          </Space>
          <Space>
            <Button icon={<LineChartOutlined />} size="small" onClick={() => setChartModalVisible(true)}>
              Visualize
            </Button>
            <Button icon={<DownloadOutlined />} size="small" onClick={exportToCSV}>
              Export CSV
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={queryResults.rows.map((row, idx) => ({
            ...row,
            key: idx,
          }))}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total: number) => `Total ${total} rows`,
            pageSizeOptions: ['25', '50', '100', '500'],
          }}
          scroll={{ x: 'max-content', y: 400 }}
          size="small"
        />
      </div>
    );
  };

  // Render query history
  const renderQueryHistory = () => {
    if (queryHistory.length === 0) return null;

    return (
      <div className={styles.queryHistory}>
        <div className={styles.historyHeader}>
          <Space>
            <HistoryOutlined />
            <Text strong>Recent Queries</Text>
          </Space>
          <Button
            size="small"
            danger
            onClick={() => {
              setQueryHistory([]);
              localStorage.removeItem('analytics_query_history');
              handleSuccess('Query history cleared');
            }}>
            Clear History
          </Button>
        </div>

        <div className={styles.historyList}>
          {queryHistory.map(item => (
            <Card
              key={item.id}
              size="small"
              hoverable
              className={styles.historyCard}
              onClick={() => loadFromHistory(item)}>
              <Space direction="vertical" size={4} className={styles.spaceFullWidth}>
                <Text ellipsis code className={styles.textRegular}>
                  {item.sql.split('\n')[0].slice(0, 100)}...
                </Text>
                <Space size="small">
                  <Tag color="blue" style={{ fontSize: 10 }}>
                    {item.rowCount} rows
                  </Tag>
                  <Tag color="green" style={{ fontSize: 10 }}>
                    {item.executionTime}ms
                  </Tag>
                  <Text type="secondary" className={styles.textTiny}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </Space>
              </Space>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className={styles.contentHeader}>
        <div className={styles.headerLeft}>
          <Title level={4} style={{ margin: 0 }}>
            <ThunderboltOutlined /> Analytics Workspace
          </Title>
          <Text type="secondary" style={{ fontSize: '1rem' }}>
            Query and analyze workunit data with SQL
          </Text>
        </div>
        <Space size={4}>
          <Tooltip title={leftCollapsed ? 'Show Query Library' : 'Hide Query Library'} placement="bottom">
            <Button
              type="text"
              className={`${styles.sidebarToggleBtn} ${!leftCollapsed ? styles.sidebarToggleBtnActive : ''}`}
              icon={<LeftPanelIcon color={!leftCollapsed ? '#1d4ed8' : '#374151'} />}
              onClick={() => setLeftCollapsed(!leftCollapsed)}
            />
          </Tooltip>
          <Tooltip title={rightCollapsed ? 'Show Schema Browser' : 'Hide Schema Browser'} placement="bottom">
            <Button
              type="text"
              className={`${styles.sidebarToggleBtn} ${!rightCollapsed ? styles.sidebarToggleBtnActive : ''}`}
              icon={<RightPanelIcon color={!rightCollapsed ? '#1d4ed8' : '#374151'} />}
              onClick={() => setRightCollapsed(!rightCollapsed)}
            />
          </Tooltip>
        </Space>
      </div>
      <div className={styles.analyticsWorkspace}>
        <Layout className={styles.layoutFullHeight}>
          {/* Left Sidebar - Query Library */}
          {!leftCollapsed && (
            <Sider width={300} theme="light" className={styles.leftSidebar}>
              {renderQueryLibrary()}
            </Sider>
          )}

          {/* Main Content Area */}
          <Content className={styles.mainContent}>
            {/* Filter Builder Card */}
            {filterBuilderVisible && (
              <div className={styles.queryBuilderContainer}>
                <Card
                  className={styles.queryBuilderCard}
                  title={
                    <Space>
                      <FilterOutlined />
                      <Text strong>Filter Builder</Text>
                    </Space>
                  }
                  extra={
                    <Button
                      size="small"
                      danger
                      onClick={() => {
                        setFilterBuilderVisible(false);
                        setWhereClauses([INITIAL_WHERE_ROW()]);
                        setSqlWhenBuilderOpened(''); // Clear saved SQL
                        setSql(DEFAULT_SQL);
                        setAppliedFilterIds(null);
                        setIsQueryExecuted(false);
                      }}>
                      Close
                    </Button>
                  }
                  size="small">
                  <div className={styles.queryBuilderBody}>
                    <div className={styles.whereClauseRowsScrollable}>
                      {whereClauses.map((row, idx) => {
                        const availableSchema = getAvailableColumns(row.id);
                        const operatorsForColumn = getOperatorsForColumn(row.column);

                        return (
                          <div key={row.id} className={styles.whereClauseRow}>
                            <span className={styles.whereConnector}>{idx === 0 ? 'WHERE' : 'AND'}</span>

                            <Select
                              placeholder="Column"
                              value={row.column || undefined}
                              onChange={val => {
                                updateWhereClause(row.id, 'column', val);
                                // Reset operator to '=' when column changes
                                updateWhereClause(row.id, 'operator', '=');
                              }}
                              showSearch
                              size="small"
                              className={styles.whereColumnSelect}>
                              {Object.entries(availableSchema).map(([table, cols]) => (
                                <Select.OptGroup label={table} key={table}>
                                  {cols.map(col => (
                                    <Select.Option key={`${table}.${col.name}`} value={col.name}>
                                      {col.name}
                                    </Select.Option>
                                  ))}
                                </Select.OptGroup>
                              ))}
                            </Select>

                            <Select
                              value={row.operator}
                              onChange={val => updateWhereClause(row.id, 'operator', val)}
                              size="small"
                              className={styles.whereOperatorSelect}>
                              {operatorsForColumn.map(op => (
                                <Select.Option key={op} value={op}>
                                  {op}
                                </Select.Option>
                              ))}
                            </Select>

                            {!['IS NULL', 'IS NOT NULL'].includes(row.operator) && (
                              <Input
                                placeholder="Value"
                                value={row.value}
                                onChange={e => updateWhereClause(row.id, 'value', e.target.value)}
                                size="small"
                                className={styles.whereValueInput}
                              />
                            )}

                            {whereClauses.length > 1 && (
                              <Tooltip title="Remove condition">
                                <Button
                                  size="small"
                                  danger
                                  icon={<MinusOutlined />}
                                  onClick={() => removeWhereClause(row.id)}
                                  className={styles.whereRowBtn}
                                />
                              </Tooltip>
                            )}

                            <Tooltip title="Add condition">
                              <Button
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={addWhereClause}
                                className={styles.whereRowBtn}
                              />
                            </Tooltip>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* SQL Editor */}
            <div className={styles.editorContainer}>
              <div className={styles.editorFrame}>
                {/* Top-right floating actions: Format, Clear */}
                <div className={styles.editorTopActions}>
                  <Tooltip title="Reset to default">
                    <Button
                      type="text"
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={() => {
                        setSql(DEFAULT_SQL);
                        setQueryResults(null);
                        setAppliedFilterIds(null);
                        setIsQueryExecuted(false);
                      }}
                      className={styles.editorActionBtn}
                    />
                  </Tooltip>
                  <Tooltip title="Format SQL (Ctrl+K)">
                    <Button
                      type="text"
                      size="small"
                      icon={<FormatPainterOutlined />}
                      onClick={formatSql}
                      className={styles.editorActionBtn}
                    />
                  </Tooltip>
                  <Tooltip title="Clear editor">
                    <Button
                      type="text"
                      size="small"
                      icon={<ClearOutlined />}
                      onClick={clearEditor}
                      className={styles.editorActionBtn}
                    />
                  </Tooltip>
                </div>

                <div className={styles.monacoWrapper}>
                  <Editor
                    height="400px"
                    defaultLanguage="sql"
                    value={sql}
                    onChange={value => {
                      setSql(value || '');
                      setIsQueryExecuted(false);
                    }}
                    onMount={(editor, monaco) => {
                      editorRef.current = editor;
                      // Add keybinding for execute
                      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, executeQuery);
                      // Add keybinding for save
                      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, handleSaveQueryClick);
                      // Add keybinding for format
                      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, formatSql);
                    }}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on',
                      padding: { top: 16 },
                    }}
                  />
                </div>

                {/* Bottom-right floating actions: Save, Execute */}
                <div className={styles.editorBottomActions}>
                  {hasWhereClause &&
                    (appliedFilterIds ? (
                      <Space.Compact className={styles.editorActionBtn}>
                        <Button className={styles.editorActionBtn} onClick={() => updateExistingFilter()}>
                          Save Filter
                        </Button>
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: 'update',
                                label: 'Save (Update Current)',
                                icon: <SaveOutlined />,
                                onClick: () => updateExistingFilter(),
                              },
                              {
                                key: 'new',
                                label: 'Save as New Filter',
                                icon: <PlusOutlined />,
                                onClick: () => saveFilterFromEditor(),
                              },
                            ],
                          }}
                          placement="bottomRight">
                          <Button icon={<EllipsisOutlined />} className={styles.editorActionBtn} />
                        </Dropdown>
                      </Space.Compact>
                    ) : (
                      <Button
                        icon={<FilterOutlined />}
                        onClick={saveFilterFromEditor}
                        className={styles.editorActionBtn}>
                        Save Filter
                      </Button>
                    ))}
                  <Button icon={<SaveOutlined />} onClick={handleSaveQueryClick} className={styles.editorActionBtn}>
                    Save Query
                  </Button>
                  <Button type="primary" icon={<PlayCircleOutlined />} loading={isExecuting} onClick={executeQuery}>
                    Execute
                  </Button>
                </div>
              </div>
            </div>
            {/* Results */}
            {renderResults()}
            {/* Query History */}
            {renderQueryHistory()}
          </Content>

          {/* Right Sidebar - Schema Browser */}
          {!rightCollapsed && (
            <Sider width={300} theme="light" className={styles.rightSidebar}>
              {renderSchemaBrowser()}
            </Sider>
          )}
        </Layout>

        {/* Save Query Modal */}
        <Modal title="Save Query" open={saveModalVisible} onCancel={() => setSaveModalVisible(false)} footer={null}>
          <Form onFinish={saveQuery} layout="vertical">
            <Form.Item
              label="Query Name"
              name="name"
              rules={[{ required: true, message: 'Please enter a query name' }]}>
              <Input placeholder="e.g., Failed Jobs Last Week" />
            </Form.Item>
            <Form.Item label="Description (Optional)" name="description">
              <Input.TextArea rows={3} placeholder="Describe what this query does..." />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
                <Button onClick={() => setSaveModalVisible(false)}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Save Filter from Editor Modal */}
        <Modal
          title="Save Filter from Query"
          destroyOnHidden={true}
          open={saveFilterFromEditorModalVisible}
          onCancel={() => {
            setSaveFilterFromEditorModalVisible(false);
            setExtractedFilterConditions('');
          }}
          footer={null}>
          <Form onFinish={confirmSaveFilterFromEditor} layout="vertical">
            <Form.Item label="Extracted Conditions">
              <Input.TextArea
                value={extractedFilterConditions}
                rows={4}
                readOnly
                style={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5' }}
              />
            </Form.Item>
            <Form.Item
              label="Filter Name"
              name="name"
              rules={[
                { required: true, message: 'Please enter a filter name' },
                { max: 30, message: 'Filter name must be 30 characters or less' },
                {
                  validator: async (_, value) => {
                    if (!value) return Promise.resolve();
                    const trimmedValue = value.trim();
                    const isDuplicate = savedFilters?.some(f => f.name.toLowerCase() === trimmedValue.toLowerCase());
                    if (isDuplicate) {
                      return Promise.reject(new Error('A filter with this name already exists'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}>
              <Input placeholder="e.g., Active Jobs Filter" maxLength={30} autoFocus showCount />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setSaveFilterFromEditorModalVisible(false);
                    setExtractedFilterConditions('');
                  }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Template Variables Modal */}
        <Modal
          title={`Template: ${currentTemplate?.name}`}
          open={variableModalVisible}
          onCancel={() => setVariableModalVisible(false)}
          onOk={applyTemplateWithVariables}>
          <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
            This template requires the following variables:
          </Text>
          <Space direction="vertical" style={{ width: '100%' }}>
            {Object.keys(templateVariables).map(varName => (
              <div key={varName}>
                <Text strong>{varName}:</Text>
                <Input
                  placeholder={`Enter ${varName}`}
                  value={templateVariables[varName]}
                  onChange={e =>
                    setTemplateVariables({
                      ...templateVariables,
                      [varName]: e.target.value,
                    })
                  }
                />
              </div>
            ))}
          </Space>
        </Modal>

        {/* Chart Modal */}
        <ChartModal visible={chartModalVisible} onClose={() => setChartModalVisible(false)} data={queryResults} />
      </div>
    </div>
  );
};

export default AnalyticsWorkspace;
