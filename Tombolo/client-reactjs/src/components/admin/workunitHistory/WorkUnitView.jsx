import { useMemo, useState } from 'react';
import {
  Tabs,
  Card,
  Descriptions,
  Tag,
  Table,
  Typography,
  Space,
  Row,
  Col,
  Tree,
  Timeline,
  Progress,
  Statistic,
  Alert,
  Empty,
  Collapse,
  Divider,
  Input,
  Select,
} from 'antd';
import {
  ClockCircleOutlined,
  NodeIndexOutlined,
  WarningOutlined,
  BarChartOutlined,
  FieldTimeOutlined,
  TableOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { normalizeLabel } from './workunitConstants';
dayjs.extend(duration);

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const formatTime = seconds => (seconds == null ? '-' : dayjs.duration(seconds, 'seconds').format('HH:mm:ss.SSS'));

const formatTimeShort = seconds => {
  if (seconds == null) return '-';
  return parseFloat(seconds).toFixed(3) + 's';
};

const formatBytes = bytes => {
  if (!bytes || isNaN(bytes)) return '-';
  let size = Number(bytes);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(2)} ${units[i]}`;
};

const formatNumber = n => (n == null ? '-' : n.toLocaleString());

const WorkUnitView = ({ wu, details }) => {
  const [selectedScope, setSelectedScope] = useState(null);
  const [problemFilter, setProblemFilter] = useState('all'); // all, high-skew, slow, spills, high-disk
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('time'); // time, skew, rows, disk

  // Auto-diagnosis: find the biggest problem
  const diagnosis = useMemo(() => {
    if (!details.length) return null;

    const activities = details.filter(d => d.scopeType === 'activity');
    const totalTime = wu.totalClusterTime || 1;

    // Find highest time consumer
    if (!activities) return null;
    const slowest = activities.reduce(
      (max, curr) => ((curr.TimeElapsed || 0) > (max.TimeElapsed || 0) ? curr : max),
      activities[0]
    );

    const slowestPct = (((slowest?.TimeElapsed || 0) / totalTime) * 100).toFixed(1);
    const hasHighSpill = (slowest?.SizeGraphSpill || 0) > 100 * 1024 * 1024 * 1024; // >100GB
    const hasHighSkew = parseFloat(slowest?.SkewMaxElapsed || 0) > 500;

    if (slowestPct > 70) {
      let msg = `${slowestPct}% of time spent in ${slowest.scopeName}`;
      if (slowest.label) msg += `: ${slowest.label.split(',')[0]}`;

      const issues = [];
      if (hasHighSpill) issues.push(`${formatBytes(slowest.SizeGraphSpill)} spill`);
      if (hasHighSkew) issues.push(`${parseFloat(slowest.SkewMaxElapsed).toFixed(0)}% skew`);

      if (issues.length > 0) {
        msg += ` → ` + issues.join(', ');
        if (hasHighSkew) msg += ` → likely data skew issue`;
      }

      return { type: 'warning', message: msg };
    }

    // Check for stuck/long running with no progress
    const hasStuck = activities.some(a => (a.TimeElapsed || 0) > 7200 && a.NumRowsProcessed === 0);
    if (hasStuck) {
      return { type: 'error', message: 'Workunit appears stuck - activities running >2h with no rows processed' };
    }

    return { type: 'success', message: 'No major performance issues detected' };
  }, [details, wu.totalClusterTime]);

  const { scopeTree, scopeMap, timelineData, totalTime } = useMemo(() => {
    const map = new Map();
    const scopeMap = new Map();
    const roots = [];

    // Build all nodes
    details.forEach(item => {
      const key = item.scopeId || item.scopeName;
      const node = { ...item, children: [] };
      map.set(key, node);
      scopeMap.set(key, node);
    });

    let maxEnd = 0;

    details.forEach(item => {
      const key = item.scopeId || item.scopeName;
      const node = map.get(key);

      // Build tree
      if (item.scopeType === 'graph') {
        roots.push(node);
      } else if (item.scopeId && item.scopeId.includes(':')) {
        const parentKey = item.scopeId.split(':').slice(0, -1).join(':');
        const parent = map.get(parentKey);
        if (parent) parent.children.push(node);
      }

      // Estimate timeline
      const start = item.TimeFirstRow || 0;
      const duration = item.TimeElapsed || 0;
      node.startTime = start;
      node.endTime = start + duration;
      maxEnd = Math.max(maxEnd, start + duration);
    });

    const timelineItems = details
      .filter(d => d.scopeType === 'activity' && d.TimeElapsed > 0.01)
      .map(d => ({
        ...d,
        key: d.scopeId || d.scopeName,
        start: d.TimeFirstRow || 0,
        duration: d.TimeElapsed || 0,
      }))
      .sort((a, b) => a.start - b.start);

    const total = wu.totalClusterTime || Math.max(maxEnd, 1);

    return { scopeTree: roots, scopeMap, timelineData: timelineItems, totalTime: total };
  }, [details, wu.totalClusterTime]);

  const selectedNode = selectedScope ? scopeMap.get(selectedScope) : null;

  // Filter and identify problem areas
  const problemAreas = useMemo(() => {
    let filtered = details.filter(d => d.scopeType === 'activity');

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        d => d.scopeName?.toLowerCase().includes(term) || d.label?.toLowerCase().includes(term)
      );
    }

    // Apply problem filter
    if (problemFilter !== 'all') {
      filtered = filtered.filter(d => {
        const skew = parseFloat(d.SkewMaxElapsed) || 0;
        const time = d.TimeElapsed || 0;
        const spill = d.SizeGraphSpill || 0;
        const diskRead = d.SizeDiskRead || 0;

        switch (problemFilter) {
          case 'high-skew':
            return skew > 200;
          case 'slow':
            return time > 1; // Activities taking more than 1 second
          case 'spills':
            return spill > 0;
          case 'high-disk':
            return diskRead > 100 * 1024 * 1024; // > 100MB
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return (b.TimeElapsed || 0) - (a.TimeElapsed || 0);
        case 'skew':
          return (parseFloat(b.SkewMaxElapsed) || 0) - (parseFloat(a.SkewMaxElapsed) || 0);
        case 'rows':
          return (b.NumRowsProcessed || 0) - (a.NumRowsProcessed || 0);
        case 'disk':
          return (b.SizeDiskRead || 0) - (a.SizeDiskRead || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [details, problemFilter, searchTerm, sortBy]);

  const hotspots = useMemo(() => {
    return problemAreas.slice(0, 15);
  }, [problemAreas]);

  const columns = [
    {
      title: 'Scope',
      render: (_, r) => {
        let displayLabel = normalizeLabel(r.label);

        return (
          <Space>
            <Text strong>{r.scopeName}</Text>
            {displayLabel && <Tag>{displayLabel}</Tag>}
          </Space>
        );
      },
      width: 220,
    },
    { title: 'Type', dataIndex: 'scopeType', width: 90 },
    {
      title: 'Elapsed',
      dataIndex: 'TimeElapsed',
      render: formatTime,
      sorter: (a, b) => (a.TimeElapsed || 0) - (b.TimeElapsed || 0),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Skew Max',
      render: (_, r) => {
        const skew = parseFloat(r.SkewMaxElapsed);
        return !isNaN(skew) ? (
          <Tag color={skew > 500 ? 'red' : skew > 200 ? 'orange' : 'green'}>{skew.toFixed(0)}%</Tag>
        ) : (
          '-'
        );
      },
    },
    { title: 'Rows', dataIndex: 'NumRowsProcessed', render: formatNumber },
    { title: 'Disk Read', dataIndex: 'SizeDiskRead', render: formatBytes },
    { title: 'Spill', dataIndex: 'SizeGraphSpill', render: formatBytes },
  ];

  const renderTreeNode = node => {
    const isSelected = selectedScope === (node.scopeId || node.scopeName);
    const pct = totalTime > 0 ? (((node.TimeElapsed || 0) / totalTime) * 100).toFixed(1) : 0;
    const hasHighSkew = parseFloat(node.SkewMaxElapsed || 0) > 500;
    const hasLargeSpill = (node.SizeGraphSpill || 0) > 100 * 1024 * 1024 * 1024; // >100GB
    const hasHighMemory = (node.PeakMemoryUsage || 0) > 1024 * 1024 * 1024 * 1024; // >1TB
    const isProblem = hasHighSkew || hasLargeSpill || hasHighMemory;

    return (
      <Tree.TreeNode
        title={
          <Space>
            {isProblem && <WarningOutlined style={{ color: '#ff4d4f' }} />}
            <span
              style={{
                color: isSelected ? '#1890ff' : isProblem ? '#ff4d4f' : undefined,
                fontWeight: isSelected ? 'bold' : 'normal',
              }}>
              {node.scopeName}
              {node.label && `: ${normalizeLabel(node.label)}`}
            </span>
            {node.TimeElapsed && (
              <Text type="secondary">
                ({formatTimeShort(node.TimeElapsed)} – {pct}%)
              </Text>
            )}
            {hasHighSkew && <Tag color="red">Skew: {parseFloat(node.SkewMaxElapsed).toFixed(0)}%</Tag>}
            {hasLargeSpill && <Tag color="orange">Spill: {formatBytes(node.SizeGraphSpill)}</Tag>}
            {hasHighMemory && <Tag color="purple">Mem: {formatBytes(node.PeakMemoryUsage)}</Tag>}
          </Space>
        }
        key={node.scopeId || node.scopeName}
        onClick={() => setSelectedScope(node.scopeId || node.scopeName)}>
        {node.children && node.children.map(renderTreeNode)}
      </Tree.TreeNode>
    );
  };

  return (
    <div style={{ padding: 24, background: '#f9f9f9', minHeight: '100vh' }}>
      <style>{`
        .problem-row-critical {
          background-color: #ffe5e5 !important;
        }
        .problem-row-critical:hover {
          background-color: #ffd1d1 !important;
        }
        .problem-row-warning {
          background-color: #fff5e6 !important;
        }
        .problem-row-warning:hover {
          background-color: #ffe8cc !important;
        }
      `}</style>

      {/* Auto-Diagnosis Banner */}
      {diagnosis && (
        <Alert
          message="Performance Analysis"
          description={diagnosis.message}
          type={diagnosis.type}
          showIcon
          style={{ marginBottom: 16 }}
          banner
        />
      )}

      {/* Header */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3}>
              {wu.jobName || wu.wuId}
              <Tag
                style={{ marginLeft: 12 }}
                color={wu.state === 'completed' ? 'success' : wu.state === 'failed' ? 'error' : 'processing'}>
                {wu.state.toUpperCase()}
              </Tag>
            </Title>
            <Text type="secondary">
              {wu.wuId} • {wu.clusterId} • Submitted {dayjs(wu.workUnitTimestamp).format('YYYY-MM-DD HH:mm:ss')}
            </Text>
          </Col>
          <Col>
            <Space size="large">
              <Statistic title="Total Time" value={formatTime(wu.totalClusterTime)} prefix={<ClockCircleOutlined />} />
              <Statistic title="Total Cost" value={`$${wu.totalCost.toFixed(4)}`} />
            </Space>
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="overview" size="large">
        {/* Overview */}
        <TabPane
          tab={
            <span>
              <BarChartOutlined /> Overview
            </span>
          }
          key="overview">
          {details.length === 0 ? (
            <Card>
              <Alert
                message="No Details Available"
                description="Detailed performance metrics have not been fetched for this workunit yet."
                type="info"
                showIcon
              />
            </Card>
          ) : (
            <>
              {/* Problem Finder Controls */}
              <Card style={{ marginBottom: 16 }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Title level={5}>🔍 Problem Finder</Title>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Input
                        placeholder="Search by scope name or label..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        prefix={<SearchOutlined />}
                        allowClear
                      />
                    </Col>
                    <Col span={8}>
                      <Select
                        value={problemFilter}
                        onChange={setProblemFilter}
                        style={{ width: '100%' }}
                        placeholder="Filter by issue type">
                        <Option value="all">All Activities</Option>
                        <Option value="high-skew">🔴 High Skew (&gt;200%)</Option>
                        <Option value="slow">⏱️ Slow Activities (&gt;1s)</Option>
                        <Option value="spills">💾 Graph Spills</Option>
                        <Option value="high-disk">💿 High Disk I/O (&gt;100MB)</Option>
                      </Select>
                    </Col>
                    <Col span={8}>
                      <Select value={sortBy} onChange={setSortBy} style={{ width: '100%' }} placeholder="Sort by">
                        <Option value="time">Sort by Time (slowest first)</Option>
                        <Option value="skew">Sort by Skew (highest first)</Option>
                        <Option value="rows">Sort by Rows Processed</Option>
                        <Option value="disk">Sort by Disk Read</Option>
                      </Select>
                    </Col>
                  </Row>
                  <Space>
                    <Text type="secondary">
                      Showing {hotspots.length} of {problemAreas.length} filtered activities
                    </Text>
                    {problemFilter !== 'all' && <Tag color="orange">Filter Active: {problemFilter}</Tag>}
                  </Space>
                </Space>
              </Card>

              <Row gutter={24}>
                <Col span={10}>
                  <Card title="Scope Hierarchy" style={{ marginBottom: 16 }}>
                    {scopeTree.length > 0 ? (
                      <Tree showLine defaultExpandAll>
                        {scopeTree.map(renderTreeNode)}
                      </Tree>
                    ) : (
                      <Empty description="No scope hierarchy available" />
                    )}
                  </Card>

                  {hotspots.length > 0 && (
                    <Card
                      title={
                        <>
                          <WarningOutlined style={{ color: '#ff4d4f' }} /> Performance Issues
                        </>
                      }>
                      <Table
                        size="small"
                        pagination={false}
                        dataSource={hotspots}
                        columns={columns.slice(0, 5)}
                        rowKey="scopeId"
                        rowClassName={record => {
                          const skew = parseFloat(record.SkewMaxElapsed) || 0;
                          const hasSpill = (record.SizeGraphSpill || 0) > 0;
                          const time = record.TimeElapsed || 0;
                          const diskRead = record.SizeDiskRead || 0;

                          // Critical: very slow (>10s), very high skew (>500%), or large spills (>1GB)
                          if (time > 10 || skew > 500 || hasSpill > 1024 * 1024 * 1024) {
                            return 'problem-row-critical';
                          }
                          // Warning: slow (>1s), high skew (>200%), or significant disk usage (>100MB)
                          else if (time > 1 || skew > 200 || diskRead > 100 * 1024 * 1024) {
                            return 'problem-row-warning';
                          }
                          return '';
                        }}
                      />
                    </Card>
                  )}
                </Col>

                <Col span={14}>
                  {selectedNode ? (
                    <Card title={`Details: ${selectedNode.scopeName}`}>
                      <Descriptions bordered column={2}>
                        <Descriptions.Item label="Type">{selectedNode.scopeType}</Descriptions.Item>
                        <Descriptions.Item label="Label">{selectedNode.label || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Elapsed">{formatTime(selectedNode.TimeElapsed)}</Descriptions.Item>
                        <Descriptions.Item label="Skew Max">
                          {selectedNode.SkewMaxElapsed ? `${parseFloat(selectedNode.SkewMaxElapsed).toFixed(1)}%` : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Rows">
                          {formatNumber(selectedNode.NumRowsProcessed)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Disk Read">
                          {formatBytes(selectedNode.SizeDiskRead)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  ) : (
                    <Card title="Top-Level Graphs">
                      {scopeTree.map(g => (
                        <div
                          key={g.scopeId}
                          style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                          <Title level={5}>
                            <NodeIndexOutlined /> {g.scopeName}
                          </Title>
                          <Row gutter={16}>
                            <Col>
                              <Statistic title="Elapsed" value={formatTime(g.TimeElapsed)} />
                            </Col>
                            <Col>
                              <Statistic title="Rows" value={formatNumber(g.NumRowsProcessed)} />
                            </Col>
                            <Col>
                              <Statistic
                                title="Disk I/O"
                                value={formatBytes((g.SizeDiskRead || 0) + (g.SizeDiskWrite || 0))}
                              />
                            </Col>
                          </Row>
                        </div>
                      ))}
                    </Card>
                  )}
                </Col>
              </Row>
            </>
          )}
        </TabPane>

        {/* Timeline */}
        <TabPane
          tab={
            <span>
              <FieldTimeOutlined /> Timeline
            </span>
          }
          key="timeline">
          <Card>
            <Text strong style={{ fontSize: 16 }}>
              Activity Execution Timeline
            </Text>
            <Text type="secondary"> (from first row to completion)</Text>

            <Timeline mode="left" style={{ marginTop: 24 }}>
              {timelineData.map(item => {
                const durationPct = totalTime > 0 ? (item.duration / totalTime) * 100 : 0;

                return (
                  <Timeline.Item
                    key={item.key}
                    label={<div style={{ width: 100, textAlign: 'right' }}>{formatTime(item.start)}</div>}>
                    <div>
                      <Text strong>{item.scopeName}</Text>
                      {item.label && <Tag style={{ marginLeft: 8 }}>{item.label}</Tag>}
                      <div style={{ marginTop: 8 }}>
                        <Progress
                          percent={100}
                          strokeWidth={14}
                          format={() => formatTime(item.duration)}
                          strokeColor={item.SkewMaxElapsed > 300 ? '#ff4d4f' : undefined}
                          style={{ width: 320 }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Ended {formatTime(item.start + item.duration)} • {durationPct.toFixed(1)}% of total time
                        </Text>
                      </div>
                    </div>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </Card>
        </TabPane>

        {/* Full Metrics Details */}
        <TabPane
          tab={
            <span>
              <TableOutlined /> All Metrics
            </span>
          }
          key="metrics">
          <Card>
            {details.length === 0 ? (
              <Empty description="No metrics available" />
            ) : (
              <Collapse accordion>
                {details.map((item, index) => {
                  // Get all non-null metrics from the item
                  const allMetrics = Object.entries(item)
                    .filter(
                      ([key, value]) =>
                        value != null &&
                        ![
                          'scopeId',
                          'scopeName',
                          'scopeType',
                          'label',
                          'children',
                          'id',
                          'wuId',
                          'createdAt',
                          'updatedAt',
                          'deletedAt',
                        ].includes(key)
                    )
                    .sort(([a], [b]) => a.localeCompare(b));

                  // Categorize metrics
                  const timeMetrics = allMetrics.filter(
                    ([key]) => key.toLowerCase().includes('time') || key.toLowerCase().includes('elapsed')
                  );
                  const sizeMetrics = allMetrics.filter(
                    ([key]) => key.toLowerCase().includes('size') || key.toLowerCase().includes('disk')
                  );
                  const countMetrics = allMetrics.filter(
                    ([key]) => key.toLowerCase().includes('num') || key.toLowerCase().includes('count')
                  );
                  const skewMetrics = allMetrics.filter(([key]) => key.toLowerCase().includes('skew'));
                  const otherMetrics = allMetrics.filter(
                    ([key]) =>
                      !timeMetrics.some(([k]) => k === key) &&
                      !sizeMetrics.some(([k]) => k === key) &&
                      !countMetrics.some(([k]) => k === key) &&
                      !skewMetrics.some(([k]) => k === key)
                  );

                  const renderMetricValue = (key, value) => {
                    if (key.toLowerCase().includes('time') || key.toLowerCase().includes('elapsed')) {
                      return formatTime(value);
                    } else if (key.toLowerCase().includes('size') || key.toLowerCase().includes('disk')) {
                      return formatBytes(value);
                    } else if (key.toLowerCase().includes('num') || key.toLowerCase().includes('count')) {
                      return formatNumber(value);
                    } else if (key.toLowerCase().includes('skew') && typeof value === 'number') {
                      return `${value.toFixed(1)}%`;
                    }
                    return value?.toString() || '-';
                  };

                  // Truncate "Keyed Join" labels for display in header
                  const displayLabel = normalizeLabel(item.label);

                  return (
                    <Collapse.Panel
                      key={item.scopeId || `scope-${index}`}
                      header={
                        <Space>
                          <Text strong>{item.scopeName}</Text>
                          {displayLabel && <Tag>{displayLabel}</Tag>}
                          <Tag color="blue">{item.scopeType}</Tag>
                          {item.TimeElapsed && <Text type="secondary">⏱ {formatTimeShort(item.TimeElapsed)}</Text>}
                        </Space>
                      }>
                      <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        {/* Key Overview */}
                        <div>
                          <Title level={5}>Overview</Title>
                          <Descriptions bordered size="small" column={2}>
                            <Descriptions.Item label="Scope ID">{item.scopeId || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Type">{item.scopeType}</Descriptions.Item>
                            {item.label && (
                              <Descriptions.Item label="Label" span={2}>
                                {item.label}
                              </Descriptions.Item>
                            )}
                            {item.fileName && (
                              <Descriptions.Item label="File Name" span={2}>
                                {item.fileName}
                              </Descriptions.Item>
                            )}
                          </Descriptions>
                        </div>

                        {/* Time Metrics */}
                        {timeMetrics.length > 0 && (
                          <div>
                            <Divider orientation="left">⏱ Time Metrics</Divider>
                            <Descriptions bordered size="small" column={2}>
                              {timeMetrics.map(([key, value]) => (
                                <Descriptions.Item key={key} label={key}>
                                  {renderMetricValue(key, value)}
                                </Descriptions.Item>
                              ))}
                            </Descriptions>
                          </div>
                        )}

                        {/* Size Metrics */}
                        {sizeMetrics.length > 0 && (
                          <div>
                            <Divider orientation="left">💾 Size & Disk Metrics</Divider>
                            <Descriptions bordered size="small" column={2}>
                              {sizeMetrics.map(([key, value]) => (
                                <Descriptions.Item key={key} label={key}>
                                  {renderMetricValue(key, value)}
                                </Descriptions.Item>
                              ))}
                            </Descriptions>
                          </div>
                        )}

                        {/* Count Metrics */}
                        {countMetrics.length > 0 && (
                          <div>
                            <Divider orientation="left">🔢 Count Metrics</Divider>
                            <Descriptions bordered size="small" column={2}>
                              {countMetrics.map(([key, value]) => (
                                <Descriptions.Item key={key} label={key}>
                                  {renderMetricValue(key, value)}
                                </Descriptions.Item>
                              ))}
                            </Descriptions>
                          </div>
                        )}

                        {/* Skew Metrics */}
                        {skewMetrics.length > 0 && (
                          <div>
                            <Divider orientation="left">⚖️ Skew Metrics</Divider>
                            <Descriptions bordered size="small" column={2}>
                              {skewMetrics.map(([key, value]) => (
                                <Descriptions.Item key={key} label={key}>
                                  {renderMetricValue(key, value)}
                                </Descriptions.Item>
                              ))}
                            </Descriptions>
                          </div>
                        )}

                        {/* Other Metrics */}
                        {otherMetrics.length > 0 && (
                          <div>
                            <Divider orientation="left">📊 Other Metrics</Divider>
                            <Descriptions bordered size="small" column={2}>
                              {otherMetrics.map(([key, value]) => (
                                <Descriptions.Item key={key} label={key}>
                                  {renderMetricValue(key, value)}
                                </Descriptions.Item>
                              ))}
                            </Descriptions>
                          </div>
                        )}
                      </Space>
                    </Collapse.Panel>
                  );
                })}
              </Collapse>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default WorkUnitView;
