import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Empty, Space, Table, Typography, message, Row, Col, Statistic, Tag } from 'antd';
import { PlayCircleOutlined, SafetyOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { formatHours, formatCurrency } from '@tombolo/shared';
import { apiClient } from '@/services/api';
import axios from 'axios';
import { relevantMetrics, forbiddenSqlKeywords } from '@tombolo/shared';
import Editor, { OnMount } from '@monaco-editor/react';
import debounce from 'lodash/debounce';
import styles from '../../workunitHistory.module.css';
import { disposeSqlAutocomplete, registerSqlAutocomplete } from '@/components/common/sqlAutocomplete';

const { Text } = Typography;

interface Props {
  wu: any;
  clusterId: string;
  wuid: string;
  clusterName?: string;
}

const BASE_COLUMNS = ['id', 'wuId', 'clusterId', 'scopeId', 'scopeName', 'scopeType', 'label', 'fileName'];
const SUGGEST_COLUMNS = Array.from(new Set([...BASE_COLUMNS, ...relevantMetrics]));

const DEFAULT_SQL = `SELECT
  scopeName, scopeType, label, fileName, TimeElapsed, TimeTotalExecute, NumRowsProcessed
FROM work_unit_details
WHERE 1=1
ORDER BY TimeElapsed DESC
LIMIT 100`;

const SqlPanel: React.FC<Props> = ({ wu, clusterId, wuid, clusterName }) => {
  const storageKey = `wuSql.${clusterId}.${wuid}`;
  const [sql, setSql] = useState(() => localStorage.getItem(storageKey) || DEFAULT_SQL);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ columns: string[]; rows: Record<string, unknown>[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const completionProviderRef = useRef<{ dispose: () => void } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const MIN_TABLE_ROWS = 15;
  const ROW_HEIGHT_PX = 28;
  const TABLE_SCROLL_Y = MIN_TABLE_ROWS * ROW_HEIGHT_PX;

  const saveRef = useRef<ReturnType<typeof debounce> | null>(null);
  const DEBOUNCE_MS = 300;

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
    saveRef.current?.(storageKey, sql);
  }, [sql, storageKey]);

  const lintSql = useMemo(() => {
    const original = sql || '';
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
  }, [sql]);

  const runQuery = async () => {
    if (!lintSql.ok) {
      message.warning(lintSql.reason || 'SQL did not pass validation');
      return;
    }

    // Create a new AbortController for this request so the user can cancel mid-flight.
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setExecuting(true);
    setError(null);
    try {
      const response = await apiClient.post(
        '/workunitAnalytics/query',
        {
          sql,
          options: {
            scopeToWuid: wuid,
            scopeToClusterId: clusterId,
          },
        },
        { signal: controller.signal }
      );
      setResult(response.data);
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
    return result.columns.map(col => ({ title: col, dataIndex: col, key: col, ellipsis: true }));
  }, [result]);

  const registerCompletionProvider = useCallback((monaco: any) => {
    registerSqlAutocomplete({
      monaco,
      completionProviderRef,
      getTables: () => ['work_unit_details'],
      getColumns: () => SUGGEST_COLUMNS,
    });
  }, []);

  const handleEditorMount: OnMount = (editor, monaco) => {
    void editor;
    registerCompletionProvider(monaco);
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
                Only SELECT statements against the <Text code>work_unit_details</Text> table are allowed. Queries are
                automatically scoped to this workunit (<Text code>{wuid}</Text>) and cluster (
                <Text code>{clusterName}</Text>), and server-limited to a maximum of 1000 rows.
              </span>
            }
          />

          <div className={styles.editorContainer}>
            <Editor
              height="280px"
              defaultLanguage="sql"
              beforeMount={registerCompletionProvider}
              value={sql}
              onChange={v => setSql(v ?? '')}
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
              <Button icon={<ReloadOutlined />} onClick={() => setSql(DEFAULT_SQL)} disabled={executing}>
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
                dataSource={result.rows}
                columns={columns}
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
