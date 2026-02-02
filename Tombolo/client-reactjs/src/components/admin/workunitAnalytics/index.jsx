import { useState, useEffect, useRef, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Layout,
  Button,
  Input,
  Table,
  Tooltip,
  message,
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
  ExpandOutlined,
  CompressOutlined,
  FileAddOutlined,
  StarOutlined,
  StarFilled,
  KeyOutlined,
  LinkOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { format } from 'sql-formatter';
import { apiClient } from '@/services/api';
import { loadLocalStorage, saveLocalStorage } from '@tombolo/shared/browser';
import QUERY_TEMPLATES from './queryTemplates';

const { Sider, Content } = Layout;
const { Panel } = Collapse;
const { Title, Text, Paragraph } = Typography;

const AnalyticsWorkspace = () => {
  const history = useHistory();
  const editorRef = useRef(null);

  // State management
  const [sql, setSql] = useState('-- Enter your SQL query here\nSELECT * FROM work_unit_details LIMIT 10');
  const [queryResults, setQueryResults] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryHistory, setQueryHistory] = useState([]);
  const [savedQueries, setSavedQueries] = useState([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [variableModalVisible, setVariableModalVisible] = useState(false);
  const [templateVariables, setTemplateVariables] = useState({});
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [leftCollapsed, setLeftCollapsed] = useState(loadLocalStorage('analytics.leftCollapsed', false));
  const [rightCollapsed, setRightCollapsed] = useState(loadLocalStorage('analytics.rightCollapsed', false));
  const [executionStats, setExecutionStats] = useState(null);
  const [schemaData, setSchemaData] = useState(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(true);

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
      } catch (error) {
        console.error('Failed to load schema:', error);
        message.error('Failed to load database schema');
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
      } catch (e) {
        console.error('Failed to load saved queries', e);
      }
    }

    const history = localStorage.getItem('analytics_query_history');
    if (history) {
      try {
        setQueryHistory(JSON.parse(history));
      } catch (e) {
        console.error('Failed to load query history', e);
      }
    }
  }, []);

  // Execute SQL query
  const executeQuery = async () => {
    if (!sql.trim()) {
      message.warning('Please enter a SQL query');
      return;
    }

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      // Use the workunitAnalytics service with extended timeout for long-running queries
      const result = await apiClient.post(
        '/workunitAnalytics/query',
        {
          sql,
          options: {},
        },
        {
          timeout: 120000, // 2 minutes for analytics queries
        }
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
      const historyEntry = {
        id: Date.now(),
        sql: sql.trim(),
        timestamp: new Date().toISOString(),
        executionTime,
        rowCount: result.data.rows.length,
      };

      const newHistory = [historyEntry, ...queryHistory].slice(0, 20);
      setQueryHistory(newHistory);
      localStorage.setItem('analytics_query_history', JSON.stringify(newHistory));

      message.success(`Query executed successfully (${executionTime}ms)`);
    } catch (error) {
      message.error(error.response?.data?.message || error.message || 'Failed to execute query');
      console.error('Query execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  // Format SQL
  const formatSql = () => {
    try {
      const formatted = format(sql, {
        language: 'mysql',
        tabWidth: 2,
        keywordCase: 'upper',
      });
      setSql(formatted);
      message.success('SQL formatted successfully');
    } catch (error) {
      console.error(error);
      message.error('Failed to format SQL');
    }
  };

  // Clear editor
  const clearEditor = () => {
    setSql('');
    setQueryResults(null);
    setExecutionStats(null);
  };

  // Save query
  const saveQuery = values => {
    const newQuery = {
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
    message.success('Query saved successfully');
  };

  // Load saved query
  const loadSavedQuery = query => {
    setSql(query.sql);
    setSelectedQuery(query.id);
    message.success(`Loaded query: ${query.name}`);
  };

  // Delete saved query
  const deleteSavedQuery = queryId => {
    const updated = savedQueries.filter(q => q.id !== queryId);
    setSavedQueries(updated);
    localStorage.setItem('analytics_saved_queries', JSON.stringify(updated));
    message.success('Query deleted');
  };

  // Toggle favorite
  const toggleFavorite = queryId => {
    const updated = savedQueries.map(q => (q.id === queryId ? { ...q, favorite: !q.favorite } : q));
    setSavedQueries(updated);
    localStorage.setItem('analytics_saved_queries', JSON.stringify(updated));
  };

  // Load template
  const loadTemplate = template => {
    // Check for variables in template
    const variableMatches = template.sql.match(/\{\{([^}]+)\}\}/g);

    if (variableMatches) {
      // Extract unique variable names
      const variables = [...new Set(variableMatches.map(m => m.slice(2, -2)))];
      setCurrentTemplate(template);
      setTemplateVariables(variables.reduce((acc, v) => ({ ...acc, [v]: '' }), {}));
      setVariableModalVisible(true);
    } else {
      setSql(template.sql);
      message.success(`Loaded template: ${template.name}`);
    }
  };

  // Apply template with variables
  const applyTemplateWithVariables = () => {
    let finalSql = currentTemplate.sql;
    Object.entries(templateVariables).forEach(([key, value]) => {
      finalSql = finalSql.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    setSql(finalSql);
    setVariableModalVisible(false);
    message.success(`Loaded template: ${currentTemplate.name}`);
  };

  // Load from history
  const loadFromHistory = historyItem => {
    setSql(historyItem.sql);
    message.success('Query loaded from history');
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

  // Export results to CSV
  const exportToCSV = () => {
    if (!queryResults || !queryResults.rows.length) {
      message.warning('No results to export');
      return;
    }

    const headers = queryResults.columns.join(',');
    const rows = queryResults.rows
      .map(row =>
        queryResults.columns
          .map(col => {
            const value = row[col];
            // Escape quotes and wrap in quotes if contains comma
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      )
      .join('\n');

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    message.success('Results exported to CSV');
  };

  // Insert column name at cursor
  const insertColumn = columnName => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const position = editor.getPosition();

      // Extract just the column name if it has table prefix
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
      message.success(`Inserted: ${actualColumnName}`);
    }
  };

  // Render query library (left sidebar)
  const renderQueryLibrary = () => (
    <div className={styles.queryLibrary}>
      <div className={styles.sidebarHeader}>
        <Title level={5}>Query Library</Title>
      </div>

      <Collapse defaultActiveKey={['saved-queries']} ghost className={styles.libraryCollapse}>
        <Panel
          header={
            <Space>
              <StarFilled style={{ color: '#faad14' }} />
              <Text strong>Saved Queries</Text>
              <Tag>{savedQueries.length}</Tag>
            </Space>
          }
          key="saved-queries">
          <Button
            type="dashed"
            icon={<FileAddOutlined />}
            block
            onClick={() => setSaveModalVisible(true)}
            style={{ marginBottom: 12 }}>
            Save Current Query
          </Button>

          {savedQueries.length === 0 ? (
            <Empty description="No saved queries yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div className={styles.savedQueriesList}>
              {savedQueries
                .sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0))
                .map(query => (
                  <Card
                    key={query.id}
                    size="small"
                    className={`${styles.savedQueryCard} ${selectedQuery === query.id ? styles.selected : ''}`}
                    hoverable
                    onClick={() => loadSavedQuery(query)}>
                    <div className={styles.savedQueryHeader}>
                      <Text strong ellipsis>
                        {query.name}
                      </Text>
                      <Space>
                        <Tooltip title={query.favorite ? 'Unfavorite' : 'Favorite'}>
                          <Button
                            type="text"
                            size="small"
                            icon={query.favorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                            onClick={e => {
                              e.stopPropagation();
                              toggleFavorite(query.id);
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="Delete">
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
                    {query.description && (
                      <Paragraph
                        ellipsis={{ rows: 2 }}
                        type="secondary"
                        style={{ fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                        {query.description}
                      </Paragraph>
                    )}
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(query.createdAt).toLocaleDateString()}
                    </Text>
                  </Card>
                ))}
            </div>
          )}
        </Panel>

        <Panel
          header={
            <Space>
              <FileTextOutlined />
              <Text strong>Templates</Text>
            </Space>
          }
          key="templates">
          {Object.entries(QUERY_TEMPLATES).map(([category, templates]) => (
            <div key={category} className={styles.templateCategory}>
              <Text type="secondary" strong style={{ fontSize: 12 }}>
                {category}
              </Text>
              <div className={styles.templateList}>
                {templates.map((template, idx) => (
                  <Tooltip
                    key={idx}
                    title={
                      <div>
                        <div style={{ marginBottom: 8 }}>{template.description}</div>
                        <pre style={{ fontSize: 11, margin: 0 }}>{template.sql.slice(0, 200)}...</pre>
                      </div>
                    }
                    placement="right">
                    <Card size="small" hoverable className={styles.templateCard} onClick={() => loadTemplate(template)}>
                      <Text ellipsis style={{ fontSize: 13 }}>
                        {template.name}
                      </Text>
                    </Card>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
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

      <Collapse defaultActiveKey={['schema']} ghost>
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
              onSelect={(selectedKeys, { node }) => {
                if (node.isLeaf) {
                  // Pass the full key which includes table name (e.g., "clusters.name")
                  insertColumn(node.key);
                }
              }}
              titleRender={node => (
                <Tooltip
                  title={node.description ? `${node.type ? `${node.type} - ` : ''}${node.description}` : null}
                  placement="right">
                  <span>
                    {node.keyType === 'PRI' && <KeyOutlined style={{ marginRight: 6, color: '#faad14' }} />}
                    {node.keyType === 'FK' && <LinkOutlined style={{ marginRight: 6, color: '#52c41a' }} />}
                    {node.keyType === 'MUL' && <MenuOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />}
                    {node.title}
                    {node.type && (
                      <Tag style={{ marginLeft: 8, fontSize: 10 }} color="blue">
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
            <Space direction="vertical" style={{ width: '100%' }}>
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
      sorter: (a, b) => {
        const aVal = a[col];
        const bVal = b[col];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return aVal - bVal;
        }
        return String(aVal).localeCompare(String(bVal));
      },
      render: (text, record) => {
        // If column is wuId, make it clickable
        if (col === 'wuId' && record.clusterId) {
          return (
            <Button
              type="link"
              size="small"
              onClick={() => history.push(`/workunits/history/${record.clusterId}/${text}`)}>
              {text}
            </Button>
          );
        }
        return text;
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
            showTotal: total => `Total ${total} rows`,
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
              message.success('Query history cleared');
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
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text ellipsis code style={{ fontSize: 12 }}>
                  {item.sql.split('\n')[0].slice(0, 100)}...
                </Text>
                <Space size="small">
                  <Tag color="blue" style={{ fontSize: 10 }}>
                    {item.rowCount} rows
                  </Tag>
                  <Tag color="green" style={{ fontSize: 10 }}>
                    {item.executionTime}ms
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 10 }}>
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
    <div className={styles.analyticsWorkspace}>
      <Layout style={{ height: '100vh' }}>
        {/* Left Sidebar - Query Library */}
        {!leftCollapsed && (
          <Sider width={300} theme="light" className={styles.leftSidebar}>
            {renderQueryLibrary()}
          </Sider>
        )}

        {/* Main Content Area */}
        <Content className={styles.mainContent}>
          <div className={styles.contentHeader}>
            <div className={styles.headerLeft}>
              <Title level={3} style={{ margin: 0 }}>
                <ThunderboltOutlined /> Analytics Workspace
              </Title>
              <Text type="secondary">Query and analyze workunit data with SQL</Text>
            </div>
            <Space>
              <Button
                icon={leftCollapsed ? <ExpandOutlined /> : <CompressOutlined />}
                onClick={() => setLeftCollapsed(!leftCollapsed)}>
                {leftCollapsed ? 'Show' : 'Hide'} Library
              </Button>
              <Button
                icon={rightCollapsed ? <ExpandOutlined /> : <CompressOutlined />}
                onClick={() => setRightCollapsed(!rightCollapsed)}>
                {rightCollapsed ? 'Show' : 'Hide'} Schema
              </Button>
            </Space>
          </div>

          {/* SQL Editor */}
          <div className={styles.editorContainer}>
            <div className={styles.editorToolbar}>
              <Space>
                <Button type="primary" icon={<PlayCircleOutlined />} loading={isExecuting} onClick={executeQuery}>
                  Execute (Ctrl+Enter)
                </Button>
                <Button icon={<FormatPainterOutlined />} onClick={formatSql}>
                  Format SQL
                </Button>
                <Button icon={<SaveOutlined />} onClick={() => setSaveModalVisible(true)}>
                  Save Query
                </Button>
                <Button icon={<ClearOutlined />} onClick={clearEditor}>
                  Clear
                </Button>
              </Space>
            </div>

            <div className={styles.monacoWrapper}>
              <Editor
                height="400px"
                defaultLanguage="sql"
                value={sql}
                onChange={value => setSql(value || '')}
                onMount={(editor, monaco) => {
                  editorRef.current = editor;
                  // Add keybinding for execute
                  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, executeQuery);
                  // Add keybinding for save
                  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => setSaveModalVisible(true));
                  // Add keybinding for format
                  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, formatSql);
                }}
                theme="vs"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                }}
              />
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
          <Form.Item label="Query Name" name="name" rules={[{ required: true, message: 'Please enter a query name' }]}>
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
    </div>
  );
};

export default AnalyticsWorkspace;
