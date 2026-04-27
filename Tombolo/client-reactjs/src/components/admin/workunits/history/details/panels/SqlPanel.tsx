import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Empty, Space, Table, Typography, message, Row, Col, Statistic, Tag } from 'antd';
import { PlayCircleOutlined, SafetyOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { formatHours, formatCurrency } from '@tombolo/shared';
import axios from 'axios';
import { relevantMetrics, forbiddenSqlKeywords } from '@tombolo/shared';
import { analyticsService } from '@/services/workunitAnalytics.service';
import Editor, { OnMount } from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
import debounce from 'lodash/debounce';
import styles from '../../workunitHistory.module.css';
import { disposeSqlAutocomplete, registerSqlAutocomplete } from '@/components/common/sqlAutocomplete';
import { compareQueryValues } from '@/components/common/sqlResultsSorting';
import type { ColumnTypeMetadata, SortDirection } from '@/components/common/sqlResultsSorting';

const { Text } = Typography;

interface Props {
  wu: any;
  clusterId: string;
  wuid: string;
  clusterName?: string;
}

const FALLBACK_ALLOWED_TABLES = ['work_unit_details', 'work_units', 'work_unit_exceptions', 'work_unit_files'];

const BASE_COLUMNS = ['id', 'wuId', 'clusterId', 'scopeId', 'scopeName', 'scopeType', 'label', 'fileName'];
const SUGGEST_COLUMNS = Array.from(new Set([...BASE_COLUMNS, ...relevantMetrics]));

const DEFAULT_SQL = `SELECT
  scopeName, scopeType, label, fileName, TimeElapsed, TimeTotalExecute, NumRowsProcessed
FROM work_unit_details
WHERE 1=1
ORDER BY TimeElapsed DESC
LIMIT 100`;

const validateSql = (rawSql: string) => {
  const original = rawSql || '';
  const trimmed = original.trim();
  if (!trimmed) {
    return { ok: false, reason: 'SQL is empty' };
  }

  const withoutComments = trimmed
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();

  if (withoutComments.includes(';')) {
    return { ok: false, reason: 'Multiple statements are not allowed (remove semicolons)' };
  }

  if (!/^select\b/i.test(withoutComments)) {
    return { ok: false, reason: 'Only SELECT statements are allowed' };
  }

  for (const kw of forbiddenSqlKeywords) {
    const re = new RegExp(`\\b${kw}\\b`, 'i');
    if (re.test(withoutComments)) {
      return { ok: false, reason: `Disallowed keyword detected: ${kw.toUpperCase()}` };
    }
  }

  return { ok: true, reason: undefined };
};

type ScopedQueryResult = {
  columns: string[];
  rows: Record<string, unknown>[];
  columnTypes?: Record<string, ColumnTypeMetadata>;
};

type ResultsSortState = {
  columnKey: string | null;
  order: SortDirection;
};

const SqlPanel: React.FC<Props> = ({ wu, clusterId, wuid, clusterName }) => {
  const storageKey = `wuSql.${clusterId}.${wuid}`;
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const currentSqlRef = useRef(localStorage.getItem(storageKey) || DEFAULT_SQL);
  const [sqlForValidation, setSqlForValidation] = useState(currentSqlRef.current);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ScopedQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultsSort, setResultsSort] = useState<ResultsSortState>({ columnKey: null, order: null });
  const completionProviderRef = useRef<{ dispose: () => void } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const tableNamesRef = useRef<string[]>(FALLBACK_ALLOWED_TABLES);
  const columnNamesRef = useRef<string[]>(SUGGEST_COLUMNS);

  const MIN_TABLE_ROWS = 15;
  const ROW_HEIGHT_PX = 28;
  const TABLE_SCROLL_Y = MIN_TABLE_ROWS * ROW_HEIGHT_PX;

  const saveRef = useRef<ReturnType<typeof debounce> | null>(null);
  const DEBOUNCE_MS = 300;

  const getCurrentSql = useCallback(() => currentSqlRef.current, []);

  const setEditorSql = useCallback(
    (nextSql: string) => {
      currentSqlRef.current = nextSql;
      setSqlForValidation(nextSql);
      saveRef.current?.(storageKey, nextSql);

      if (editorRef.current && editorRef.current.getValue() !== nextSql) {
        editorRef.current.setValue(nextSql);
      }
    },
    [storageKey]
  );

  useEffect(() => {
    saveRef.current = debounce((key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch (_) {
        // best-effort persistence; ignore quota or availability errors
      }
    }, DEBOUNCE_MS);

    return () => {
      if (saveRef.current?.flush) saveRef.current.flush();
      if (saveRef.current?.cancel) saveRef.current.cancel();
    };
  }, []);

  useEffect(() => {
    const storedSql = localStorage.getItem(storageKey) || DEFAULT_SQL;
    setEditorSql(storedSql);
  }, [storageKey, setEditorSql]);

  useEffect(() => {
    let mounted = true;

    const fetchSchemaForAutocomplete = async () => {
      try {
        const schema = await analyticsService.getScopedSchema();

        if (!mounted || !schema || typeof schema !== 'object') return;

        const tableNames = Object.keys(schema);
        if (tableNames.length > 0) {
          tableNamesRef.current = tableNames;
        }

        const schemaColumns = tableNames.flatMap(table =>
          (schema[table] || [])
            .map(column => column?.name)
            .filter((columnName): columnName is string => Boolean(columnName))
        );

        if (schemaColumns.length > 0) {
          columnNamesRef.current = Array.from(new Set([...SUGGEST_COLUMNS, ...schemaColumns]));
        }
      } catch {
        // Keep static fallbacks if schema metadata request fails.
      }
    };

    void fetchSchemaForAutocomplete();

    return () => {
      mounted = false;
    };
  }, []);

  const lintSql = useMemo(() => {
    return validateSql(sqlForValidation);
  }, [sqlForValidation]);

  const runQuery = async () => {
    const currentSql = getCurrentSql();
    const validation = validateSql(currentSql);

    if (!validation.ok) {
      message.warning(validation.reason || 'SQL did not pass validation');
      return;
    }

    // Create a new AbortController for this request so the user can cancel mid-flight.
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setExecuting(true);
    setError(null);
    try {
      const scopedResult = await analyticsService.executeScopedQuery(
        currentSql,
        {
          scopeToWuid: wuid,
          scopeToClusterId: clusterId,
        },
        { signal: controller.signal }
      );
      setResult(scopedResult);
      setResultsSort({ columnKey: null, order: null });
    } catch (err: unknown) {
      if (axios.isCancel(err)) {
        message.info('Query cancelled');
      } else {
        const anyErr = err as {
          response?: { data?: { message?: string } };
          messages?: string[];
          raw?: { message?: string };
        };
        const serverMsg = anyErr?.response?.data?.message || anyErr?.messages?.[0];
        const detailedMsg = serverMsg || anyErr?.raw?.message || 'Failed to execute SQL';
        setError(detailedMsg);
        message.error('Failed to execute SQL');
      }
    } finally {
      abortControllerRef.current = null;
      setExecuting(false);
    }
  };

  const columns = useMemo(() => {
    if (!result?.columns?.length) return [];
    return result.columns.map(col => ({
      title: col,
      dataIndex: col,
      key: col,
      ellipsis: true,
      sorter: true,
      sortOrder: resultsSort.columnKey === col ? resultsSort.order : null,
      sortDirections: ['ascend', 'descend'] as ('ascend' | 'descend')[],
    }));
  }, [result, resultsSort]);

  const sortedRows = useMemo(() => {
    if (!result?.rows) return [];

    const rowsWithIndex = result.rows.map((row, idx) => ({ row, idx }));

    if (!resultsSort.columnKey || !resultsSort.order) {
      return rowsWithIndex.map(({ row }) => row);
    }

    const columnKey = resultsSort.columnKey;
    const family = result.columnTypes?.[columnKey]?.family ?? 'unknown';

    return [...rowsWithIndex]
      .sort((a, b) => {
        const cmp = compareQueryValues(a.row[columnKey], b.row[columnKey], family, resultsSort.order);

        if (cmp !== 0) return cmp;
        return a.idx - b.idx;
      })
      .map(({ row }) => row);
  }, [result, resultsSort]);

  const registerCompletionProvider = useCallback((monaco: Monaco) => {
    registerSqlAutocomplete({
      monaco,
      completionProviderRef,
      getTables: () => tableNamesRef.current,
      getColumns: () => columnNamesRef.current,
      triggerCharacters: ['.', ' ', '\n', '\t'],
    });
  }, []);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    currentSqlRef.current = editor.getValue();
    registerCompletionProvider(monaco);

    editor.onDidChangeModelContent(() => {
      const nextValue = editor.getValue();
      currentSqlRef.current = nextValue;
      setSqlForValidation(nextValue);
      saveRef.current?.(storageKey, nextValue);
    });
  };

  useEffect(() => {
    return () => {
      disposeSqlAutocomplete(completionProviderRef);
    };
  }, []);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* Job Header */}
      <Card>
        <Row justify="space-between" align="middle">
          <Col flex={1}>
            <Space direction="vertical" size={4}>
              <Space size={12} align="center">
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {wu?.jobName || wu?.wuId}
                </Typography.Title>
                <Tag color={wu?.state === 'completed' ? 'success' : wu?.state === 'failed' ? 'error' : 'processing'}>
                  {wu?.state?.toUpperCase()}
                </Tag>
              </Space>
              <Typography.Text type="secondary">
                {wu?.wuId} • {clusterName || wu?.clusterId} • Submitted{' '}
                {dayjs(wu?.workUnitTimestamp).format('YYYY-MM-DD HH:mm:ss')}
              </Typography.Text>
            </Space>
          </Col>
          <Col>
            <Row gutter={16}>
              <Col>
                <Statistic title="Total Runtime" value={formatHours(wu?.totalClusterTime)} />
              </Col>
              <Col>
                <Statistic title="Total Cost" value={formatCurrency(wu?.totalCost)} />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* SQL Interface */}
      <Card>
        <Space direction="vertical" className={styles.fullWidth} size="middle">
          <Alert
            type="info"
            showIcon
            message={
              <Space size="small">
                <SafetyOutlined />
                <Text strong>Read-only SQL</Text>
              </Space>
            }
            description={
              <span>
                Only SELECT statements against allowed analytics tables are permitted (for example{' '}
                <Text code>work_unit_details</Text>, <Text code>work_unit_exceptions</Text>, and{' '}
                <Text code>work_unit_files</Text>). Queries are automatically scoped to this workunit (
                <Text code>{wuid}</Text>) and cluster (<Text code>{clusterName}</Text>), and server-limited to a maximum
                of 1000 rows.
              </span>
            }
          />

          <div className={styles.editorContainer}>
            <Editor
              height="280px"
              defaultLanguage="sql"
              beforeMount={registerCompletionProvider}
              defaultValue={currentSqlRef.current}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: 'off',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                tabSize: 2,
                automaticLayout: true,
                suggestOnTriggerCharacters: true,
              }}
            />
          </div>

          {!lintSql.ok && (
            <Alert
              type="warning"
              showIcon
              message="Query blocked by client-side safety checks"
              description={lintSql.reason}
            />
          )}

          {error && <Alert type="error" showIcon message="SQL Error" description={error} />}

          <div className={styles.justifyBetween}>
            <Space>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                loading={executing}
                onClick={runQuery}
                disabled={executing || !lintSql.ok}>
                Run
              </Button>
              <Button
                icon={<StopOutlined />}
                danger
                disabled={!executing}
                onClick={() => abortControllerRef.current?.abort()}>
                Cancel
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => setEditorSql(DEFAULT_SQL)} disabled={executing}>
                Reset to default
              </Button>
            </Space>
          </div>

          <Card size="small" title="Results" className={styles.resultsCardMarginTop}>
            {!result?.rows?.length ? (
              <Empty description="No results" />
            ) : (
              <Table
                size="small"
                rowKey={(row, i) =>
                  String((row as Record<string, unknown>).id ?? (row as Record<string, unknown>).scopeId ?? i)
                }
                dataSource={sortedRows}
                columns={columns}
                onChange={(_pagination, _filters, sorter) => {
                  const normalizedSorter = Array.isArray(sorter) ? sorter[0] : sorter;
                  const columnKey =
                    normalizedSorter && typeof normalizedSorter.columnKey === 'string'
                      ? normalizedSorter.columnKey
                      : null;
                  const order =
                    normalizedSorter?.order === 'ascend' || normalizedSorter?.order === 'descend'
                      ? normalizedSorter.order
                      : null;

                  setResultsSort({ columnKey, order });
                }}
                pagination={{ pageSize: 50 }}
                scroll={{ x: true, y: TABLE_SCROLL_Y }}
              />
            )}
          </Card>
        </Space>
      </Card>
    </Space>
  );
};

export default SqlPanel;
