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
import { DatabaseOutlined, FieldTimeOutlined, NodeIndexOutlined, ProfileOutlined } from '@ant-design/icons';
import { formatBytes, formatNumber, formatSeconds, renderAnyMetric, formatHours } from '@tombolo/shared';
import HierarchyExplorer, {
  HierarchyExplorerSelectPayload,
  buildScopeTree,
  findPathByKey,
  flattenTree,
} from './HierarchyExplorer';
import styles from '../../workunitHistory.module.css';

const { Text } = Typography;

interface Props {
  wu: any;
  details: any[];
  clusterName?: string;
}

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
      totalElapsed += Number(d.TimeElapsed || 0);
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

  const childCols = [
    {
      title: 'Scope',
      dataIndex: 'scopeName',
      key: 'scopeName',
      render: (v: any, r: any) => (
        <Space size={6} align="start">
          <Tag color="blue" className={`${styles.tagCapitalize} ${styles.mr0}`}>
            {r.scopeType}
          </Tag>
          <Space direction="vertical" size={0}>
            <span>{v}</span>
            {r.label && (
              <Text type="secondary" className={styles.smallText}>
                {r.label}
              </Text>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Elapsed',
      dataIndex: 'TimeElapsed',
      key: 'TimeElapsed',
      align: 'right' as const,
      render: (v: any) => <span className={styles.numericText}>{formatSeconds(v)}</span>,
      sorter: (a: any, b: any) => (a.TimeElapsed || 0) - (b.TimeElapsed || 0),
    },
    {
      title: 'Rows',
      dataIndex: 'NumRowsProcessed',
      key: 'NumRowsProcessed',
      align: 'right' as const,
      render: (v: any) => <span className={styles.numericText}>{formatNumber(v)}</span>,
      sorter: (a: any, b: any) => (a.NumRowsProcessed || 0) - (b.NumRowsProcessed || 0),
    },
    {
      title: 'Memory',
      dataIndex: 'PeakMemoryUsage',
      key: 'PeakMemoryUsage',
      align: 'right' as const,
      render: (v: any) => <span className={styles.numericText}>{formatBytes(v)}</span>,
      sorter: (a: any, b: any) => (a.PeakMemoryUsage || 0) - (b.PeakMemoryUsage || 0),
    },
  ];

  return (
    <Space direction="vertical" size={16} className={styles.fullWidth}>
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
                {wu.wuId} • Engine: {wu.engine} • Cluster: {clusterName || wu.clusterId} • Owner: {wu.owner}
              </div>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Total Elapsed"
                  value={formatHours(wu.totalClusterTime)}
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

      <Row gutter={[16, 16]}>
        {/* ── Left column: Hierarchy Explorer ── */}
        <Col xs={24} lg={10} xl={9}>
          <HierarchyExplorer details={details} storageKeyPrefix="wuh.overview" onSelect={handleExplorerSelect} />
        </Col>

        {/* ── Right column: Scope Details ── */}
        <Col xs={24} lg={14} xl={15}>
          <Card
            title={
              <Space>
                <NodeIndexOutlined /> Scope Details
              </Space>
            }
            className={styles.cardNoBodyPadding}>
            {!selectedNode ? (
              <Empty description="Select a scope from the tree to view details" className={styles.contentPadding} />
            ) : (
              <div className={styles.scrollAreaTall}>
                <Breadcrumb className={styles.mb12}>
                  {breadcrumb.map((b: any) => (
                    <Breadcrumb.Item
                      key={b.key}
                      onClick={() => selectNodeByKey(b.key)}
                      className={styles.cursorPointer}>
                      {b.title}
                    </Breadcrumb.Item>
                  ))}
                </Breadcrumb>
                <Descriptions size="small" bordered column={2}>
                  {Object.entries(selectedNode)
                    .filter(([key, value]) => {
                      if (['key', 'children', 'id', '_level', 'scopeId', 'clusterId', 'wuId'].includes(key))
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
                  <Card size="small" className={styles.mt16} title="Children">
                    <Table
                      size="small"
                      pagination={{ pageSize: 10 }}
                      rowKey={(r: any) => r.key}
                      dataSource={selectedNode.children}
                      columns={childCols}
                      onRow={record => ({ onClick: () => selectNodeByKey(record.key) })}
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
