import { useMemo, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Input,
  Select,
  Button,
  Drawer,
  Descriptions,
  Empty,
  Tag,
  Typography,
  Segmented,
  Tooltip,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { formatSeconds, formatNumber, formatBytes, renderAnyMetric } from '@tombolo/shared';

const { Text } = Typography;

// Scope type colors and metadata
const SCOPE_CONFIG = {
  graph: { color: '#1890ff', label: 'Graph', icon: '📊' },
  subgraph: { color: '#13c2c2', label: 'Subgraph', icon: '📁' },
  activity: { color: '#52c41a', label: 'Activity', icon: '⚙️' },
  operation: { color: '#fa8c16', label: 'Operation', icon: '🔧' },
};

// Process raw details into timeline items
function processTimelineData(details) {
  if (!details || details.length === 0) return [];

  const items = details
    .map((d, i) => {
      const start = Number(d.TimeFirstRow || 0);
      const elapsed = Number(d.TimeElapsed || 0);
      const end = start + elapsed;

      return {
        id: d.scopeId || d.scopeName || `scope-${i}`,
        scopeId: d.scopeId,
        name: d.scopeName || 'Unnamed',
        type: d.scopeType || 'activity',
        start,
        end,
        elapsed,
        // Metrics
        rows: Number(d.NumRowsProcessed || 0),
        diskRead: Number(d.SizeDiskRead || 0),
        diskWrite: Number(d.SizeDiskWrite || 0),
        memory: Number(d.PeakMemoryUsage || 0),
        // Additional context
        label: d.label,
        fileName: d.fileName,
        rawData: d,
      };
    })
    .filter(item => item.elapsed > 0); // Only show scopes that took time

  // Sort by start time for better visual flow
  return items.sort((a, b) => a.start - b.start);
}

// Calculate critical path (simplified heuristic: longest running scopes)
function identifyCriticalPath(items, topN = 10) {
  return [...items]
    .sort((a, b) => b.elapsed - a.elapsed)
    .slice(0, topN)
    .map(item => item.id);
}

// Group items into swim lanes by graph
function groupByGraph(items) {
  const groups = new Map();

  items.forEach(item => {
    // Extract graph from scopeId (e.g., "G1:SG2:A3" -> "G1")
    let graphKey = 'Other';
    if (item.scopeId) {
      const parts = item.scopeId.split(':');
      if (parts.length > 0 && parts[0].startsWith('G')) {
        graphKey = parts[0];
      }
    }

    if (!groups.has(graphKey)) {
      groups.set(graphKey, []);
    }
    groups.get(graphKey).push(item);
  });

  return groups;
}

const TimelinePanel = ({ wu, details }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState(['graph', 'subgraph', 'activity', 'operation']);
  const [viewMode, setViewMode] = useState('gantt'); // 'gantt' | 'swim-lanes' | 'list'
  const [highlightMode, setHighlightMode] = useState('none'); // 'none' | 'critical' | 'slow'
  const [selectedItem, setSelectedItem] = useState(null);

  // Process data
  const allItems = useMemo(() => processTimelineData(details), [details]);

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Type filter
      if (!selectedTypes.includes(item.type)) return false;

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const searchText = `${item.name} ${item.label || ''} ${item.fileName || ''}`.toLowerCase();
        if (!searchText.includes(term)) return false;
      }

      return true;
    });
  }, [allItems, selectedTypes, searchTerm]);

  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    if (filteredItems.length === 0) return { min: 0, max: 0, duration: 0 };

    let min = Infinity;
    let max = -Infinity;

    for (const item of filteredItems) {
      if (item.start < min) min = item.start;
      if (item.end > max) max = item.end;
    }

    // Also consider total cluster time
    const totalClusterTime = Number(wu?.totalClusterTime || 0);
    if (totalClusterTime > max) max = totalClusterTime;

    return { min, max, duration: max - min };
  }, [filteredItems, wu]);

  // Summary statistics
  const statistics = useMemo(() => {
    let totalRows = 0;
    let totalDiskRead = 0;
    let totalDiskWrite = 0;
    let maxMemory = 0;
    let slowestItem = null;

    filteredItems.forEach(item => {
      totalRows += item.rows;
      totalDiskRead += item.diskRead;
      totalDiskWrite += item.diskWrite;
      maxMemory = Math.max(maxMemory, item.memory);

      if (!slowestItem || item.elapsed > slowestItem.elapsed) {
        slowestItem = item;
      }
    });

    return {
      count: filteredItems.length,
      totalRows,
      totalDiskRead,
      totalDiskWrite,
      maxMemory,
      slowestItem,
    };
  }, [filteredItems]);

  // Identify critical path
  const criticalPathIds = useMemo(() => identifyCriticalPath(filteredItems, 10), [filteredItems]);

  // Group by graph for swim lane view
  const graphGroups = useMemo(() => groupByGraph(filteredItems), [filteredItems]);

  // Determine if item should be highlighted
  const shouldHighlight = item => {
    if (highlightMode === 'critical') return criticalPathIds.includes(item.id);
    if (highlightMode === 'slow') {
      const threshold = timelineBounds.duration * 0.1; // Top 10% duration
      return item.elapsed >= threshold;
    }
    return false;
  };

  // Reset all filters
  const handleReset = () => {
    setSearchTerm('');
    setSelectedTypes(['graph', 'subgraph', 'activity', 'operation']);
    setViewMode('gantt');
    setHighlightMode('none');
  };

  // Render timeline bar
  const renderTimelineBar = (item, index, containerWidth = 800) => {
    const { min, max } = timelineBounds;
    const totalSpan = max - min;

    if (totalSpan === 0) return null;

    const leftPercent = ((item.start - min) / totalSpan) * 100;
    const widthPercent = (item.elapsed / totalSpan) * 100;
    const isHighlighted = shouldHighlight(item);
    const config = SCOPE_CONFIG[item.type] || SCOPE_CONFIG.activity;

    return (
      <div
        key={item.id}
        className="timeline-row"
        style={{
          padding: '4px 0',
          borderBottom: '1px solid #f0f0f0',
          cursor: 'pointer',
        }}
        onClick={() => setSelectedItem(item)}>
        <Row gutter={8} align="middle">
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{config.icon}</span>
              <Tooltip title={item.name}>
                <Text
                  ellipsis
                  style={{
                    fontSize: 12,
                    fontWeight: isHighlighted ? 600 : 400,
                  }}>
                  {item.name}
                </Text>
              </Tooltip>
            </div>
          </Col>
          <Col span={14}>
            <div
              style={{
                position: 'relative',
                height: 24,
                background: '#f5f5f5',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
              <div
                style={{
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  height: '100%',
                  background: config.color,
                  opacity: isHighlighted ? 1 : 0.7,
                  border: isHighlighted ? '2px solid #000' : 'none',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                }}
              />
            </div>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatSeconds(item.elapsed)}
            </Text>
          </Col>
        </Row>
      </div>
    );
  };

  // Render swim lane view
  const renderSwimLanes = () => {
    const lanes = Array.from(graphGroups.entries());

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {lanes.map(([graphKey, items]) => (
          <Card
            key={graphKey}
            size="small"
            title={
              <Space>
                <Text strong>{graphKey}</Text>
                <Tag>{items.length} scopes</Tag>
              </Space>
            }>
            {items.map((item, idx) => renderTimelineBar(item, idx))}
          </Card>
        ))}
      </Space>
    );
  };

  const renderListView = () => {
    return (
      <div>
        {filteredItems.map((item, _idx) => (
          <Card key={item.id} size="small" hoverable style={{ marginBottom: 8 }} onClick={() => setSelectedItem(item)}>
            <Row gutter={16}>
              <Col span={12}>
                <Space>
                  <span>{SCOPE_CONFIG[item.type]?.icon}</span>
                  <Text strong>{item.name}</Text>
                </Space>
              </Col>
              <Col span={4}>
                <Statistic
                  title="Duration"
                  value={item.elapsed}
                  formatter={v => formatSeconds(v)}
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col span={4}>
                <Statistic title="Rows" value={formatNumber(item.rows)} valueStyle={{ fontSize: 14 }} />
              </Col>
              <Col span={4}>
                <Statistic title="Memory" value={formatBytes(item.memory)} valueStyle={{ fontSize: 14 }} />
              </Col>
            </Row>
          </Card>
        ))}
      </div>
    );
  };

  if (!details || details.length === 0) {
    return <Empty description="No timeline data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* Summary Statistics */}
      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic title="Total Scopes" value={statistics.count} prefix={<BarChartOutlined />} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Execution Time"
              value={formatSeconds(timelineBounds.duration)}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Rows Processed"
              value={formatNumber(statistics.totalRows)}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Peak Memory" value={formatBytes(statistics.maxMemory)} />
          </Col>
        </Row>

        {statistics.slowestItem && (
          <Alert
            style={{ marginTop: 16 }}
            message={
              <Space>
                <WarningOutlined />
                <Text>
                  Slowest scope: <Text strong>{statistics.slowestItem.name}</Text> (
                  {formatSeconds(statistics.slowestItem.elapsed)})
                </Text>
              </Space>
            }
            type="info"
            showIcon={false}
          />
        )}
      </Card>

      {/* Controls */}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Search by name, label, or file..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col xs={24} md={8}>
              <Select
                mode="multiple"
                placeholder="Filter by type"
                value={selectedTypes}
                onChange={setSelectedTypes}
                style={{ width: '100%' }}
                maxTagCount="responsive">
                {Object.entries(SCOPE_CONFIG).map(([key, config]) => (
                  <Select.Option key={key} value={key}>
                    {config.icon} {config.label}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={8}>
              <Button icon={<FilterOutlined />} onClick={handleReset} block>
                Reset Filters
              </Button>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Space>
                <Text type="secondary">View:</Text>
                <Segmented
                  value={viewMode}
                  onChange={setViewMode}
                  options={[
                    { label: 'Timeline', value: 'gantt' },
                    { label: 'Swim Lanes', value: 'swim-lanes' },
                    { label: 'List', value: 'list' },
                  ]}
                />
              </Space>
            </Col>
            <Col span={12}>
              <Space>
                <Text type="secondary">Highlight:</Text>
                <Segmented
                  value={highlightMode}
                  onChange={setHighlightMode}
                  options={[
                    { label: 'None', value: 'none' },
                    { label: 'Critical Path', value: 'critical' },
                    { label: 'Slowest', value: 'slow' },
                  ]}
                />
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Timeline Visualization */}
      <Card
        title={
          <Space>
            <Text strong>Execution Timeline</Text>
            <Tooltip title="Click on any bar to see detailed metrics">
              <InfoCircleOutlined />
            </Tooltip>
          </Space>
        }>
        {filteredItems.length === 0 ? (
          <Empty description="No items match your filters" />
        ) : (
          <>
            {/* Timeline axis */}
            <div style={{ marginBottom: 16, padding: '0 8px' }}>
              <Row gutter={8}>
                <Col span={6}></Col>
                <Col span={14}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      color: '#8c8c8c',
                      borderBottom: '1px solid #d9d9d9',
                      paddingBottom: 4,
                    }}>
                    <span>{formatSeconds(timelineBounds.min)}</span>
                    <span>{formatSeconds((timelineBounds.min + timelineBounds.max) / 2)}</span>
                    <span>{formatSeconds(timelineBounds.max)}</span>
                  </div>
                </Col>
                <Col span={4}></Col>
              </Row>
            </div>

            {/* Timeline content based on view mode */}
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {viewMode === 'gantt' && filteredItems.map((item, idx) => renderTimelineBar(item, idx))}
              {viewMode === 'swim-lanes' && renderSwimLanes()}
              {viewMode === 'list' && renderListView()}
            </div>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Showing {filteredItems.length} of {allItems.length} scopes
              </Text>
            </div>
          </>
        )}
      </Card>

      {/* Details Drawer */}
      <Drawer
        title={
          <Space>
            <span>{SCOPE_CONFIG[selectedItem?.type]?.icon}</span>
            <span>{selectedItem?.name}</span>
          </Space>
        }
        placement="right"
        open={!!selectedItem}
        width={600}
        onClose={() => setSelectedItem(null)}>
        {selectedItem && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* Quick metrics */}
            <Card size="small" title="Performance Metrics">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Duration"
                    value={formatSeconds(selectedItem.elapsed)}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic title="Rows Processed" value={formatNumber(selectedItem.rows)} />
                </Col>
                <Col span={12}>
                  <Statistic title="Disk Read" value={formatBytes(selectedItem.diskRead)} />
                </Col>
                <Col span={12}>
                  <Statistic title="Disk Write" value={formatBytes(selectedItem.diskWrite)} />
                </Col>
                <Col span={12}>
                  <Statistic title="Peak Memory" value={formatBytes(selectedItem.memory)} />
                </Col>
                <Col span={12}>
                  <Statistic title="Type" value={SCOPE_CONFIG[selectedItem.type]?.label} />
                </Col>
              </Row>
            </Card>

            {/* All attributes */}
            <Card size="small" title="All Attributes">
              <Descriptions column={1} size="small" bordered>
                {Object.entries(selectedItem.rawData)
                  .filter(([k, v]) => v != null && !['children', 'key'].includes(k))
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([k, v]) => (
                    <Descriptions.Item key={k} label={k}>
                      {renderAnyMetric(k, v)}
                    </Descriptions.Item>
                  ))}
              </Descriptions>
            </Card>
          </Space>
        )}
      </Drawer>
    </Space>
  );
};

export default TimelinePanel;
