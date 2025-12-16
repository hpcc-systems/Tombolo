import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Input,
  Checkbox,
  InputNumber,
  Tooltip,
  Tag,
  Tree,
  Descriptions,
  Table,
  Breadcrumb,
  Divider,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  ProfileOutlined,
  NodeIndexOutlined,
  FieldTimeOutlined,
  DatabaseOutlined,
  ClusterOutlined,
} from '@ant-design/icons';
import { formatSeconds, formatNumber, formatBytes } from '@tombolo/shared';
import { loadLocalStorage, saveLocalStorage } from '@tombolo/shared/browser';
import styles from './workunitHistory.module.css';

// Build hierarchical tree from flat details using scopeId path (e.g., G1:SG2:A3)
function buildScopeTree(details) {
  const map = new Map();
  const roots = [];
  // First pass: create nodes
  details.forEach(d => {
    const key = d.scopeId || d.scopeName;
    map.set(key, { ...d, key, children: [] });
  });
  // Second pass: attach to parent by trimming last segment in scopeId
  details.forEach(d => {
    const key = d.scopeId || d.scopeName;
    const node = map.get(key);
    const sid = d.scopeId;
    if (d.scopeType === 'graph' || !sid || !sid.includes(':')) {
      roots.push(node);
    } else {
      const parentKey = sid.split(':').slice(0, -1).join(':');
      const parent = map.get(parentKey);
      (parent ? parent.children : roots).push(node);
    }
  });
  return roots;
}

function flattenTree(nodes) {
  const out = [];
  const visit = arr =>
    arr?.forEach(n => {
      out.push(n);
      if (n.children) visit(n.children);
    });
  visit(nodes);
  return out;
}

function findPathByKey(nodes, key) {
  const stack = [];
  const dfs = list => {
    for (const n of list) {
      stack.push(n);
      if (n.key === key) return true;
      if (n.children && dfs(n.children)) return true;
      stack.pop();
    }
    return false;
  };
  dfs(nodes);
  return stack.map(n => ({ title: n.scopeName, key: n.key }));
}

const SCOPE_TYPES = ['graph', 'subgraph', 'activity', 'operation'];

const OverviewPanel = ({ wu, details }) => {
  // Preferences / UI state
  const [types, setTypes] = useState(loadLocalStorage('wuh.overview.types', SCOPE_TYPES));
  const [q, setQ] = useState(loadLocalStorage('wuh.overview.q', ''));
  const [minElapsed, setMinElapsed] = useState(loadLocalStorage('wuh.overview.minElapsed', 0));
  const [expandedKeys, setExpandedKeys] = useState(loadLocalStorage('wuh.overview.expandedKeys', []));
  const [autoExpand, setAutoExpand] = useState(loadLocalStorage('wuh.overview.autoExpand', false));
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => saveLocalStorage('wuh.overview.types', types), [types]);
  useEffect(() => saveLocalStorage('wuh.overview.q', q), [q]);
  useEffect(() => saveLocalStorage('wuh.overview.minElapsed', minElapsed), [minElapsed]);
  useEffect(() => saveLocalStorage('wuh.overview.expandedKeys', expandedKeys), [expandedKeys]);
  useEffect(() => saveLocalStorage('wuh.overview.autoExpand', autoExpand), [autoExpand]);

  // Build tree once
  const treeRaw = useMemo(() => buildScopeTree(details || []), [details]);

  // Filtering functions
  const term = q.trim().toLowerCase();
  const nodeMatches = n => {
    if (!types.includes(n.scopeType)) return false;
    if (minElapsed && Number(n.TimeElapsed || 0) < Number(minElapsed)) return false;
    if (term) {
      const s = `${n.scopeName || ''} ${n.label || ''} ${n.fileName || ''}`.toLowerCase();
      if (!s.includes(term)) return false;
    }
    return true;
  };

  // Prune tree to matches but keep parents of matches
  const treeFiltered = useMemo(() => {
    const clone = node => ({ ...node, children: node.children?.map(clone) || [] });
    const roots = treeRaw.map(clone);
    const prune = node => {
      const match = nodeMatches(node);
      node.children = node.children.map(prune).filter(Boolean);
      return match || node.children.length ? node : null;
    };
    return roots.map(prune).filter(Boolean);
  }, [treeRaw, types, term, minElapsed]);

  // Aggregates
  const flatList = useMemo(() => flattenTree(treeFiltered), [treeFiltered]);
  const summary = useMemo(() => {
    let rows = 0,
      diskR = 0,
      diskW = 0,
      maxMem = 0,
      totalElapsed = 0;
    flatList.forEach(d => {
      rows += Number(d.NumRowsProcessed || 0);
      diskR += Number(d.SizeDiskRead || 0);
      diskW += Number(d.SizeDiskWrite || 0);
      maxMem = Math.max(maxMem, Number(d.PeakMemoryUsage || 0));
      totalElapsed += Number(d.TimeElapsed || 0);
    });
    const counts = {
      total: flatList.length,
      graph: flatList.filter(d => d.scopeType === 'graph').length,
      subgraph: flatList.filter(d => d.scopeType === 'subgraph').length,
      activity: flatList.filter(d => d.scopeType === 'activity').length,
      operation: flatList.filter(d => d.scopeType === 'operation').length,
    };
    return { rows, diskR, diskW, maxMem, totalElapsed, counts };
  }, [flatList]);

  // Prepare tree data for AntD
  const renderTitle = n => (
    <Space size={8}>
      <Tag color="blue" className={styles.tagCapitalize}>
        {n.scopeType}
      </Tag>
      <span className={styles.ellipsis}>{n.scopeName}</span>
      <span className={`${styles.subtleText} ${styles.numericText}`}>
        <Tooltip title="Elapsed">⏱ {formatSeconds(n.TimeElapsed)}</Tooltip>
        {n.NumRowsProcessed != null && (
          <>
            {' '}
            • <Tooltip title="Rows">🔢 {formatNumber(n.NumRowsProcessed)}</Tooltip>
          </>
        )}
        {n.PeakMemoryUsage != null && (
          <>
            {' '}
            • <Tooltip title="Peak Memory">🧠 {formatBytes(n.PeakMemoryUsage)}</Tooltip>
          </>
        )}
      </span>
    </Space>
  );

  const toAntTreeNodes = nodes =>
    nodes.map(n => ({
      key: n.key,
      title: renderTitle(n),
      children: n.children && n.children.length ? toAntTreeNodes(n.children) : undefined,
    }));

  const antTreeData = useMemo(() => toAntTreeNodes(treeFiltered), [treeFiltered]);

  // Auto expand first level on mount or when filter changes (guarded)
  useEffect(() => {
    if (!autoExpand) return;
    const keys = [];
    const stack = [...treeFiltered];
    const LIMIT = 2000; // prevent expanding huge trees
    while (stack.length && keys.length < LIMIT) {
      const n = stack.pop();
      keys.push(n.key);
      if (n.children) stack.push(...n.children);
    }
    setExpandedKeys(keys);
  }, [treeFiltered, autoExpand]);

  // Selected node and details
  const selectedNode = useMemo(() => flatList.find(n => n.key === selectedKey) || null, [flatList, selectedKey]);
  const breadcrumb = useMemo(
    () => (selectedKey ? findPathByKey(treeFiltered, selectedKey) : []),
    [treeFiltered, selectedKey]
  );

  const topActivities = useMemo(() => {
    return flatList
      .filter(d => d.scopeType === 'activity')
      .sort((a, b) => (b.TimeElapsed || 0) - (a.TimeElapsed || 0))
      .slice(0, 10);
  }, [flatList]);

  // Children table columns
  const childCols = [
    {
      title: 'Scope',
      dataIndex: 'scopeName',
      key: 'scopeName',
      render: (v, r) => (
        <Space size={6}>
          <Tag color="blue" className={`${styles.tagCapitalize} ${styles.mr0}`}>
            {r.scopeType}
          </Tag>
          <span>{v}</span>
        </Space>
      ),
    },
    {
      title: 'Elapsed',
      dataIndex: 'TimeElapsed',
      key: 'TimeElapsed',
      align: 'right',
      render: v => <span className={styles.numericText}>{formatSeconds(v)}</span>,
      sorter: (a, b) => (a.TimeElapsed || 0) - (b.TimeElapsed || 0),
    },
    {
      title: 'Rows',
      dataIndex: 'NumRowsProcessed',
      key: 'NumRowsProcessed',
      align: 'right',
      render: v => <span className={styles.numericText}>{formatNumber(v)}</span>,
      sorter: (a, b) => (a.NumRowsProcessed || 0) - (b.NumRowsProcessed || 0),
    },
    {
      title: 'Memory',
      dataIndex: 'PeakMemoryUsage',
      key: 'PeakMemoryUsage',
      align: 'right',
      render: v => <span className={styles.numericText}>{formatBytes(v)}</span>,
      sorter: (a, b) => (a.PeakMemoryUsage || 0) - (b.PeakMemoryUsage || 0),
    },
  ];

  return (
    <Space direction="vertical" size={16} className={styles.fullWidth}>
      {/* Workunit header summary */}
      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={6}>
              <Space size={8}>
                <ProfileOutlined />
                <span className={styles.fw600}>{wu.jobName || wu.wuId}</span>
                <Tag color={wu.state === 'completed' ? 'success' : wu.state === 'failed' ? 'error' : 'processing'}>
                  {(wu.state || '').toUpperCase()}
                </Tag>
              </Space>
              <div className={styles.mutedTextMid}>
                {wu.wuId} • Engine: {wu.engine} • Owner: {wu.owner}
              </div>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Total Elapsed"
                  valueRender={() => <span>{formatSeconds(wu.totalClusterTime)}</span>}
                  prefix={<FieldTimeOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total Rows"
                  valueRender={() => <span>{formatNumber(summary.rows)}</span>}
                  prefix={<DatabaseOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Max Memory"
                  valueRender={() => <span>{formatBytes(summary.maxMem)}</span>}
                  prefix={<NodeIndexOutlined />}
                />
              </Col>
            </Row>
          </Col>
        </Row>
        <Divider className={styles.dividerTight} />
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Statistic title="Scopes" value={summary.counts.total} />
          </Col>
          <Col xs={12} md={4}>
            <Statistic title="Graphs" value={summary.counts.graph} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="Subgraphs" value={summary.counts.subgraph} />
          </Col>
          <Col xs={12} md={4}>
            <Statistic title="Activities" value={summary.counts.activity} />
          </Col>
          <Col xs={12} md={4}>
            <Statistic title="Operations" value={summary.counts.operation} />
          </Col>
        </Row>
      </Card>

      {/* Explorer and details */}
      <Row gutter={16}>
        <Col xs={24} lg={10} xxl={8}>
          <Card
            title={
              <Space>
                <ClusterOutlined /> Hierarchy Explorer
              </Space>
            }
            className={styles.cardNoBodyPadding}>
            <div className={styles.sectionHeader}>
              <Space wrap>
                <Input
                  allowClear
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  prefix={<SearchOutlined />}
                  placeholder="Search scope, label, file"
                  className={styles.w260}
                />
                <Checkbox.Group
                  value={types}
                  onChange={setTypes}
                  options={[
                    { label: 'Graph', value: 'graph' },
                    { label: 'Subgraph', value: 'subgraph' },
                    { label: 'Activity', value: 'activity' },
                    { label: 'Operation', value: 'operation' },
                  ]}
                />
                <Space size={8}>
                  <span>Min Elapsed</span>
                  <InputNumber min={0} value={minElapsed} onChange={setMinElapsed} placeholder="s" />
                </Space>
              </Space>
            </div>
            <div className={styles.scrollAreaTall}>
              {antTreeData.length ? (
                <Tree
                  blockNode
                  showLine
                  treeData={antTreeData}
                  expandedKeys={expandedKeys}
                  onExpand={setExpandedKeys}
                  selectedKeys={selectedKey ? [selectedKey] : []}
                  onSelect={keys => setSelectedKey(keys[0])}
                />
              ) : (
                <Empty description="No scopes match filters" />
              )}
            </div>
          </Card>

          <Card title="Top Activities (Elapsed)" className={`${styles.mt16} ${styles.cardBodyPadTop8}`}>
            {topActivities.length ? (
              <Table
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={topActivities}
                columns={[
                  { title: '#', render: (_v, _r, i) => i + 1, width: 48 },
                  { title: 'Activity', dataIndex: 'scopeName', ellipsis: true },
                  {
                    title: 'Elapsed',
                    dataIndex: 'TimeElapsed',
                    align: 'right',
                    render: v => <span className={styles.numericText}>{formatSeconds(v)}</span>,
                  },
                ]}
                onRow={record => ({ onClick: () => setSelectedKey(record.key) })}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No activities" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={14} xxl={16}>
          <Card
            title={
              <Space>
                <NodeIndexOutlined /> Scope Details
              </Space>
            }>
            {!selectedNode ? (
              <Empty description="Select a scope from the tree to view details" />
            ) : (
              <>
                <Breadcrumb className={styles.mb12}>
                  {breadcrumb.map(b => (
                    <Breadcrumb.Item key={b.key} onClick={() => setSelectedKey(b.key)} className={styles.cursorPointer}>
                      {b.title}
                    </Breadcrumb.Item>
                  ))}
                </Breadcrumb>
                <Descriptions size="small" bordered column={2}>
                  <Descriptions.Item label="Scope Name" span={2}>
                    {selectedNode.scopeName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Type">{selectedNode.scopeType}</Descriptions.Item>
                  <Descriptions.Item label="File">{selectedNode.fileName || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Label" span={2}>
                    {selectedNode.label || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Elapsed">{formatSeconds(selectedNode.TimeElapsed)}</Descriptions.Item>
                  <Descriptions.Item label="Execute">{formatSeconds(selectedNode.TimeTotalExecute)}</Descriptions.Item>
                  <Descriptions.Item label="Rows">{formatNumber(selectedNode.NumRowsProcessed)}</Descriptions.Item>
                  <Descriptions.Item label="Disk Read">{formatBytes(selectedNode.SizeDiskRead)}</Descriptions.Item>
                  <Descriptions.Item label="Disk Write">{formatBytes(selectedNode.SizeDiskWrite)}</Descriptions.Item>
                  <Descriptions.Item label="Peak Memory">{formatBytes(selectedNode.PeakMemoryUsage)}</Descriptions.Item>
                </Descriptions>

                {!!(selectedNode.children && selectedNode.children.length) && (
                  <Card size="small" className={styles.mt16} title="Children">
                    <Table
                      size="small"
                      pagination={{ pageSize: 10 }}
                      rowKey={r => r.key}
                      dataSource={selectedNode.children}
                      columns={childCols}
                      onRow={record => ({ onClick: () => setSelectedKey(record.key) })}
                    />
                  </Card>
                )}
              </>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default OverviewPanel;
