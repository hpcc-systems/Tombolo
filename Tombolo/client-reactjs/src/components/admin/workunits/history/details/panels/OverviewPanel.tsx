import React, { useEffect, useMemo, useState } from 'react';
import {
  Breadcrumb,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Segmented,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Divider,
} from 'antd';
import {
  ApartmentOutlined,
  NodeIndexOutlined,
  ProfileOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  SCOPE_TYPE_COLORS,
  formatBytes,
  formatLabel,
  formatNumber,
  formatSeconds,
  formatSecondsAsHours,
  formatHours,
  formatCurrency,
  renderAnyMetric as renderAnyMetricShared,
} from '@tombolo/shared';
import FlatScopesPanel from './FlatScopesPanel';
import HierarchyExplorer, {
  HierarchyExplorerSelectPayload,
  buildScopeTree,
  findPathByKey,
  flattenTree,
} from './HierarchyExplorer';
import type { WorkUnit } from '@tombolo/shared';

const { Text } = Typography;

const SCOPE_VIEW_STORAGE_KEY = 'wuh.overview.scope-view-mode';

type ScopeViewMode = 'hierarchical' | 'flat';

function renderAnyMetric(key: string, value: any): React.ReactNode {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return renderAnyMetricShared(key, value);
}

interface Props {
  wu: WorkUnit;
  details: any[];
  clusterName?: string;
}

const OverviewPanel: React.FC<Props> = ({ wu, details, clusterName }) => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ title: string; key: any }[]>([]);
  const [scopeViewMode, setScopeViewMode] = useState<ScopeViewMode>('hierarchical');
  const isFlatView = scopeViewMode === 'flat';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(SCOPE_VIEW_STORAGE_KEY);
    if (saved === 'flat' || saved === 'hierarchical') {
      setScopeViewMode(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SCOPE_VIEW_STORAGE_KEY, scopeViewMode);
  }, [scopeViewMode]);

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

  const flatScopes = useMemo(() => flattenTree(treeNodes), [treeNodes]);

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
                ? SCOPE_TYPE_COLORS.graph
                : r.scopeType === 'subgraph'
                  ? SCOPE_TYPE_COLORS.subgraph
                  : r.scopeType === 'activity'
                    ? SCOPE_TYPE_COLORS.activity
                    : SCOPE_TYPE_COLORS.operation
            }
            style={{ textTransform: 'capitalize', margin: 0 }}>
            {r.scopeType}
          </Tag>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>{v}</span>
            {r.label && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatLabel(r.label)}
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
        <div>
          <Space align="center">
            <ProfileOutlined style={{ fontSize: 20, color: '#1677ff' }} />
            <Text strong style={{ fontSize: 16 }}>
              {wu.jobName || wu.wuId}
            </Text>
            <Tag color={stateColor} icon={stateIcon}>
              {(wu.state || '').toUpperCase()}
            </Tag>
          </Space>
          <div>
            <Text type="secondary">
              {wu.wuId} • Engine: {wu.engine} • Cluster: {clusterName || wu.clusterId} • Owner: {wu.owner} • Submitted:{' '}
              {dayjs(wu.workUnitTimestamp).format('YYYY-MM-DD HH:mm:ss')}
            </Text>
          </div>
          <Divider />
          <Space wrap size="small" style={{ marginTop: '16px', width: '100%', justifyContent: 'space-between' }}>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic
                title="Total Runtime"
                value={formatHours(wu.totalClusterTime)}
                valueStyle={{ fontSize: '1.2rem' }}
              />
            </Card>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic title="Total Cost" value={formatCurrency(wu.totalCost)} valueStyle={{ fontSize: '1.2rem' }} />
            </Card>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic
                title="Total Elapsed"
                value={formatSecondsAsHours(summary.totalElapsed)}
                valueStyle={{ fontSize: '1.2rem' }}
              />
            </Card>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic
                title="Max Memory"
                value={formatBytes(summary.maxMem)}
                // prefix={<NodeIndexOutlined />}
                valueStyle={{ fontSize: '1.2rem' }}
              />
            </Card>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic
                title="Total Rows"
                value={formatNumber(summary.rows)}
                // prefix={<DatabaseOutlined />}
                valueStyle={{ fontSize: '1.2rem' }}
              />
            </Card>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic
                title="Total Scopes"
                value={summary.counts.total}
                valueStyle={{ fontSize: '1.2rem', color: SCOPE_TYPE_COLORS.graph }}
              />
            </Card>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic
                title="Graphs"
                value={summary.counts.graph}
                valueStyle={{ fontSize: '1.2rem', color: SCOPE_TYPE_COLORS.graph }}
              />
            </Card>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic
                title="Subgraphs"
                value={summary.counts.subgraph}
                valueStyle={{ fontSize: '1.2rem', color: SCOPE_TYPE_COLORS.subgraph }}
              />
            </Card>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic
                title="Activities"
                value={summary.counts.activity}
                valueStyle={{ fontSize: '1.2rem', color: SCOPE_TYPE_COLORS.activity }}
              />
            </Card>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic
                title="Operations"
                value={summary.counts.operation}
                valueStyle={{ fontSize: '1.2rem', color: SCOPE_TYPE_COLORS.operation }}
              />
            </Card>
          </Space>
        </div>
      </Card>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {/* Left: Scope Browser */}
        <Col xs={24} lg={isFlatView ? 14 : 10} xl={isFlatView ? 14 : 9}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <NodeIndexOutlined />
                  <span>Scopes</span>
                  <Tag style={{ marginLeft: 8, fontWeight: 'normal' }}>{flatScopes.length} items</Tag>
                </Space>
                <Segmented
                  size="small"
                  value={scopeViewMode}
                  onChange={value => setScopeViewMode(value as ScopeViewMode)}
                  options={[
                    {
                      label: (
                        <Space size={4}>
                          <ApartmentOutlined />
                          <span>Hierarchical</span>
                        </Space>
                      ),
                      value: 'hierarchical',
                    },
                    {
                      label: (
                        <Space size={4}>
                          <UnorderedListOutlined />
                          <span>Flat</span>
                        </Space>
                      ),
                      value: 'flat',
                    },
                  ]}
                />
              </Space>
            </Card>

            {scopeViewMode === 'hierarchical' ? (
              <HierarchyExplorer details={details} storageKeyPrefix="wuh.overview" onSelect={handleExplorerSelect} />
            ) : (
              <FlatScopesPanel items={flatScopes} selectedKey={selectedNode?.key} onSelectKey={selectNodeByKey} />
            )}
          </Space>
        </Col>

        {/* Right: Scope Details */}
        <Col xs={24} lg={isFlatView ? 10 : 14} xl={isFlatView ? 10 : 15}>
          <Card
            title={
              <Space>
                <NodeIndexOutlined />
                <span>Scope Details</span>
              </Space>
            }
            styles={{ body: { padding: 0 } }}>
            {!selectedNode ? (
              <Empty
                description="Select a scope from the list or tree to view details"
                style={{ padding: '48px 24px' }}
              />
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
