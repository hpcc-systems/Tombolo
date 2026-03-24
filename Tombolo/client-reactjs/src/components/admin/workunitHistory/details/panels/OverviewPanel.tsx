import React, { useMemo, useState } from 'react';
import {
  Breadcrumb,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  DatabaseOutlined,
  FieldTimeOutlined,
  NodeIndexOutlined,
  ProfileOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { SCOPE_TYPE_COLORS } from '@tombolo/shared';
import HierarchyExplorer, {
  HierarchyExplorerSelectPayload,
  buildScopeTree,
  findPathByKey,
  flattenTree,
} from './HierarchyExplorer';

const { Text } = Typography;

// ── Formatters ───────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatNumber(num: number | null | undefined): string {
  if (num == null) return '0';
  return num.toLocaleString();
}

function formatSeconds(sec: number | null | undefined): string {
  if (sec == null) return '0s';
  const s = Number(sec);
  if (isNaN(s)) return '0s';
  if (s < 60) return `${s.toFixed(2)}s`;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}m ${secs.toFixed(0)}s`;
}

function formatHours(sec: number | null | undefined): string {
  if (sec == null) return '0h';
  const hours = sec / 3600;
  if (hours < 1) return formatSeconds(sec);
  return `${hours.toFixed(2)}h`;
}

function renderAnyMetric(key: string, value: any): React.ReactNode {
  if (value == null) return '-';
  if (key.toLowerCase().includes('time') || key.toLowerCase().includes('elapsed')) {
    return formatSeconds(Number(value));
  }
  if (
    key.toLowerCase().includes('size') ||
    key.toLowerCase().includes('memory') ||
    key.toLowerCase().includes('bytes')
  ) {
    return formatBytes(Number(value));
  }
  if (key.toLowerCase().includes('rows') || key.toLowerCase().includes('count')) {
    return formatNumber(Number(value));
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  wu: {
    jobName?: string;
    wuId?: string;
    state?: string;
    engine?: string;
    clusterId?: string;
    owner?: string;
    totalClusterTime?: number;
  };
  details: any[];
  clusterName?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

const OverviewPanel: React.FC<Props> = ({ wu, details, clusterName }) => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ title: string; key: any }[]>([]);

  const treeNodes = useMemo(() => buildScopeTree(details || []), [details]);

  const selectNodeByKey = (key: any) => {
    const flat = flattenTree(treeNodes);
    const node = flat.find((n: any) => n.key === key);
    if (node) {
      setSelectedNode(node);
      setBreadcrumb(findPathByKey(treeNodes, key));
    }
  };

  const handleExplorerSelect = ({ node, breadcrumb: bc }: HierarchyExplorerSelectPayload) => {
    setSelectedNode(node);
    setBreadcrumb(bc);
  };

  const summary = useMemo(() => {
    let rows = 0,
      diskR = 0,
      diskW = 0,
      maxMem = 0,
      totalElapsed = 0;
    (details || []).forEach((d: any) => {
      rows += Number(d.NumRowsProcessed || 0);
      diskR += Number(d.SizeDiskRead || 0);
      diskW += Number(d.SizeDiskWrite || 0);
      maxMem = Math.max(maxMem, Number(d.PeakMemoryUsage || 0));
      if (d.scopeType === 'graph') totalElapsed += Number(d.TimeElapsed || 0);
    });
    const counts = {
      total: (details || []).length,
      graph: (details || []).filter((d: any) => d.scopeType === 'graph').length,
      subgraph: (details || []).filter((d: any) => d.scopeType === 'subgraph').length,
      activity: (details || []).filter((d: any) => d.scopeType === 'activity').length,
      operation: (details || []).filter((d: any) => d.scopeType === 'operation').length,
    };
    return { rows, diskR, diskW, maxMem, totalElapsed, counts };
  }, [details]);

  const stateIcon =
    wu.state === 'completed' ? (
      <CheckCircleOutlined style={{ color: '#52c41a' }} />
    ) : wu.state === 'failed' ? (
      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
    ) : (
      <SyncOutlined spin style={{ color: '#1677ff' }} />
    );

  const stateColor = wu.state === 'completed' ? 'success' : wu.state === 'failed' ? 'error' : 'processing';

  const childCols = [
    {
      title: 'Scope',
      dataIndex: 'scopeName',
      key: 'scopeName',
      render: (v: any, r: any) => (
        <Space size={8} align="center">
          <Tag
            color={
              r.scopeType === 'graph'
                ? '#1677ff'
                : r.scopeType === 'subgraph'
                  ? '#52c41a'
                  : r.scopeType === 'activity'
                    ? '#faad14'
                    : '#eb2f96'
            }
            style={{ textTransform: 'capitalize', margin: 0 }}>
            {r.scopeType}
          </Tag>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>{v}</span>
            {r.label && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.label}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Elapsed',
      dataIndex: 'TimeElapsed',
      key: 'TimeElapsed',
      align: 'right' as const,
      width: 100,
      render: (v: any) => <span style={{ fontFamily: 'monospace' }}>{formatSeconds(v)}</span>,
      sorter: (a: any, b: any) => (a.TimeElapsed || 0) - (b.TimeElapsed || 0),
    },
    {
      title: 'Rows',
      dataIndex: 'NumRowsProcessed',
      key: 'NumRowsProcessed',
      align: 'right' as const,
      width: 100,
      render: (v: any) => <span style={{ fontFamily: 'monospace' }}>{formatNumber(v)}</span>,
      sorter: (a: any, b: any) => (a.NumRowsProcessed || 0) - (b.NumRowsProcessed || 0),
    },
    {
      title: 'Memory',
      dataIndex: 'PeakMemoryUsage',
      key: 'PeakMemoryUsage',
      align: 'right' as const,
      width: 100,
      render: (v: any) => <span style={{ fontFamily: 'monospace' }}>{formatBytes(v)}</span>,
      sorter: (a: any, b: any) => (a.PeakMemoryUsage || 0) - (b.PeakMemoryUsage || 0),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* Summary Card */}
      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={4}>
              <Space size={12} align="center">
                <ProfileOutlined style={{ fontSize: 20, color: '#1677ff' }} />
                <Text strong style={{ fontSize: 16 }}>
                  {wu.jobName || wu.wuId}
                </Text>
                <Tag color={stateColor} icon={stateIcon}>
                  {(wu.state || '').toUpperCase()}
                </Tag>
              </Space>
              <Text type="secondary" style={{ marginLeft: 32 }}>
                {wu.wuId} • Engine: {wu.engine} • Cluster: {clusterName || wu.clusterId} • Owner: {wu.owner}
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Total Elapsed"
                  value={formatHours(summary.totalElapsed)}
                  prefix={<FieldTimeOutlined />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total Rows"
                  value={formatNumber(summary.rows)}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Max Memory"
                  value={formatBytes(summary.maxMem)}
                  prefix={<NodeIndexOutlined />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
        <Divider style={{ margin: '16px 0' }} />
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={4}>
            <Statistic
              title="Total Scopes"
              value={summary.counts.total}
              valueStyle={{ color: SCOPE_TYPE_COLORS.graph }}
            />
          </Col>
          <Col xs={12} sm={5}>
            <Statistic title="Graphs" value={summary.counts.graph} valueStyle={{ color: SCOPE_TYPE_COLORS.graph }} />
          </Col>
          <Col xs={12} sm={5}>
            <Statistic
              title="Subgraphs"
              value={summary.counts.subgraph}
              valueStyle={{ color: SCOPE_TYPE_COLORS.subgraph }}
            />
          </Col>
          <Col xs={12} sm={5}>
            <Statistic
              title="Activities"
              value={summary.counts.activity}
              valueStyle={{ color: SCOPE_TYPE_COLORS.activity }}
            />
          </Col>
          <Col xs={12} sm={5}>
            <Statistic
              title="Operations"
              value={summary.counts.operation}
              valueStyle={{ color: SCOPE_TYPE_COLORS.operation }}
            />
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {/* Left: Hierarchy Explorer */}
        <Col xs={24} lg={10} xl={9}>
          <HierarchyExplorer details={details} storageKeyPrefix="wuh.overview" onSelect={handleExplorerSelect} />
        </Col>

        {/* Right: Scope Details */}
        <Col xs={24} lg={14} xl={15}>
          <Card
            title={
              <Space>
                <NodeIndexOutlined />
                <span>Scope Details</span>
              </Space>
            }
            styles={{ body: { padding: 0 } }}>
            {!selectedNode ? (
              <Empty description="Select a scope from the tree to view details" style={{ padding: '48px 24px' }} />
            ) : (
              <div style={{ maxHeight: 540, overflowY: 'auto', padding: 16 }}>
                <Breadcrumb
                  style={{ marginBottom: 16 }}
                  items={breadcrumb.map(b => ({
                    key: b.key,
                    title: (
                      <span onClick={() => selectNodeByKey(b.key)} style={{ cursor: 'pointer', color: '#1677ff' }}>
                        {b.title}
                      </span>
                    ),
                  }))}
                />
                <Descriptions size="small" bordered column={2}>
                  {Object.entries(selectedNode)
                    .filter(([key, value]) => {
                      if (['key', 'children', 'id', '_level', '_depth', 'scopeId', 'clusterId', 'wuId'].includes(key))
                        return false;
                      if (value === null || value === undefined || value === '') return false;
                      return true;
                    })
                    .sort(([a], [b]) => {
                      const top = ['scopeName', 'scopeType', 'label', 'fileName'];
                      const ia = top.indexOf(a);
                      const ib = top.indexOf(b);
                      if (ia !== -1 && ib !== -1) return ia - ib;
                      if (ia !== -1) return -1;
                      if (ib !== -1) return 1;
                      return a.localeCompare(b);
                    })
                    .map(([key, value]) => (
                      <Descriptions.Item key={key} label={key} span={['scopeName', 'label'].includes(key) ? 2 : 1}>
                        {renderAnyMetric(key, value)}
                      </Descriptions.Item>
                    ))}
                </Descriptions>

                {!!(selectedNode.children && selectedNode.children.length) && (
                  <Card size="small" style={{ marginTop: 16 }} title={`Children (${selectedNode.children.length})`}>
                    <Table
                      size="small"
                      pagination={{ pageSize: 10, size: 'small' }}
                      rowKey={(r: any) => r.key}
                      dataSource={selectedNode.children.map(({ children: _c, ...rest }: any) => rest)}
                      columns={childCols}
                      onRow={record => ({
                        onClick: () => selectNodeByKey(record.key),
                        style: { cursor: 'pointer' },
                      })}
                    />
                  </Card>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default OverviewPanel;
