import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Empty, Space, Table, Typography, message } from 'antd';
import { PlayCircleOutlined, SafetyOutlined, ReloadOutlined } from '@ant-design/icons';
import workunitsService from '@/services/workunits.service';
import { relevantMetrics, forbiddenSqlKeywords } from '@tombolo/shared';
import Editor from '@monaco-editor/react';
import debounce from 'lodash/debounce';
import styles from './workunitHistory.module.css';

const { Text, Paragraph } = Typography;

const BASE_COLUMNS = ['id', 'wuId', 'clusterId', 'scopeId', 'scopeName', 'scopeType', 'label', 'fileName'];
const SUGGEST_COLUMNS = Array.from(new Set([...BASE_COLUMNS, ...relevantMetrics]));

const DEFAULT_SQL = `SELECT
  scopeName, scopeType, label, fileName, TimeElapsed, TimeTotalExecute, NumRowsProcessed
FROM work_unit_details
WHERE 1=1
ORDER BY TimeElapsed DESC
LIMIT 100`;

export default function SqlPanel({ clusterId, wuid }) {
  const storageKey = `wuSql.${clusterId}.${wuid}`;
  const [sql, setSql] = useState(() => localStorage.getItem(storageKey) || DEFAULT_SQL);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null); // { columns: string[], rows: any[] }
  const [error, setError] = useState(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const MIN_TABLE_ROWS = 15;
  const ROW_HEIGHT_PX = 28;
  const TABLE_SCROLL_Y = MIN_TABLE_ROWS * ROW_HEIGHT_PX; // 420px

  // Debounce localStorage writes to avoid excessive sync I/O during typing
  const saveRef = useRef(null);
  const DEBOUNCE_MS = 300;

  // Create a stable debounced saver once
  useEffect(() => {
    saveRef.current = debounce((key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch (_) {
        // best-effort persistence; ignore quota or availability errors
      }
    }, DEBOUNCE_MS);

    return () => {
      // Flush the pending write on unmount to persist last edits
      if (saveRef.current?.flush) saveRef.current.flush();
    };
  }, []);

  // Invoke debounced saver whenever sql or key changes
  useEffect(() => {
    saveRef.current?.(storageKey, sql);
  }, [sql, storageKey]);

  // Very lightweight SQL linter (client-side) — no libraries, just simple checks
  const lintSql = useMemo(() => {
    const original = sql || '';
    const trimmed = original.trim();
    if (!trimmed) {
      return { ok: false, reason: 'SQL is empty' };
    }

    // Strip line and block comments
    const withoutComments = trimmed
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();

    // Single statement only (no semicolons anywhere)
    if (withoutComments.includes(';')) {
      return { ok: false, reason: 'Multiple statements are not allowed (remove semicolons)' };
    }

    if (!/^select\b/i.test(withoutComments)) {
      return { ok: false, reason: 'Only SELECT statements are allowed' };
    }

    // Disallow destructive keywords (basic word-boundary checks)
    for (const kw of forbiddenSqlKeywords) {
      const re = new RegExp(`\\b${kw}\\b`, 'i');
      if (re.test(withoutComments)) {
        return { ok: false, reason: `Disallowed keyword detected: ${kw.toUpperCase()}` };
      }
    }

    return { ok: true };
  }, [sql]);

  const runQuery = async () => {
    // Guard on linter result to prevent sending invalid SQL
    if (!lintSql.ok) {
      message.warning(lintSql.reason || 'SQL did not pass validation');
      return;
    }
    setExecuting(true);
    setError(null);
    try {
      const data = await workunitsService.executeSql(clusterId, wuid, sql);
      setResult(data);
    } catch (err) {
      const serverMsg = err?.messages?.[0];
      const detailedMsg = serverMsg || err?.raw?.message || 'Failed to execute SQL';
      setError(detailedMsg);
      message.error('Failed to execute SQL');
    } finally {
      setExecuting(false);
    }
  };

  const columns = useMemo(() => {
    if (!result?.columns?.length) return [];
    return result.columns.map(col => ({ title: col, dataIndex: col, key: col, ellipsis: true }));
  }, [result]);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Keep internal state in sync with editor content
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      setSql(value);
    });

    // Register SQL completion suggestions using SUGGEST_COLUMNS
    const disposable = monaco.languages.registerCompletionItemProvider('sql', {
      triggerCharacters: ['.', ' ', '\n', '\t'],
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const columnSuggestions = SUGGEST_COLUMNS.map(c => ({
          label: c,
          kind: monaco.languages.CompletionItemKind.Field,
          insertText: c,
          range,
        }));

        const keywordSuggestions = [
          'SELECT',
          'FROM',
          'WHERE',
          'AND',
          'OR',
          'ORDER BY',
          'GROUP BY',
          'LIMIT',
          'ASC',
          'DESC',
          'COUNT',
          'AVG',
          'SUM',
          'MIN',
          'MAX',
        ].map(k => ({
          label: k,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: k,
          range,
        }));

        const tableSuggestions = [{ label: 'work_unit_details', kind: monaco.languages.CompletionItemKind.Class }].map(
          t => ({ ...t, insertText: t.label, range })
        );

        return { suggestions: [...keywordSuggestions, ...tableSuggestions, ...columnSuggestions] };
      },
    });

    // Clean up on unmount
    editor.onDidDispose(() => {
      try {
        disposable.dispose();
      } catch (err) {
        console.error('Failed to dispose SQL completion provider', err);
      }
    });
  };

  return (
    <Card>
      <Space direction="vertical" className={styles.fullWidth} size="middle">
        <Alert
          type="info"
          showIcon
          message={
            <Space>
              <SafetyOutlined />
              <Text strong>Read-only SQL</Text>
            </Space>
          }
          description={
            <>
              <Paragraph className={styles.tightParagraph}>
                Only SELECT statements against the <Text code>work_unit_details</Text> table are allowed. Queries are
                automatically scoped to this workunit (<Text code>{wuid}</Text>) and cluster (
                <Text code>{clusterId}</Text>), and limited to a maximum of 1000 rows.
              </Paragraph>
            </>
          }
        />

        <div className={styles.editorContainer}>
          <Editor
            height="280px"
            defaultLanguage="sql"
            value={sql}
            onChange={v => setSql(v ?? '')}
            onMount={handleEditorMount}
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
              rowKey={(_, i) => i}
              dataSource={result.rows}
              columns={columns}
              pagination={{ pageSize: 50 }}
              scroll={{ x: true, y: TABLE_SCROLL_Y }}
            />
          )}
        </Card>
      </Space>
    </Card>
  );
}
