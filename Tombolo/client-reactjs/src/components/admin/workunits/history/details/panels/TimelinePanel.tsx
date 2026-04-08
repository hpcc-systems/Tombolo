import React, { useMemo, useState, useCallback } from 'react';
import { List, RowComponentProps } from 'react-window';
import {
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Input,
  Drawer,
  Descriptions,
  Empty,
  Tag,
  Typography,
  Segmented,
  Tooltip,
  Alert,
  Collapse,
  Checkbox,
  InputNumber,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  HddOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { formatSeconds, formatNumber, formatBytes, formatHours, formatCurrency } from '@tombolo/shared';

const { Text } = Typography;

// ── Scope Configuration ──────────────────────────────────────────────────────

const SCOPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  graph: { label: 'Graph', color: '#1677ff', icon: <BarChartOutlined style={{ color: '#1677ff' }} /> },
  subgraph: { label: 'Subgraph', color: '#52c41a', icon: <BarChartOutlined style={{ color: '#52c41a' }} /> },
  activity: { label: 'Activity', color: '#faad14', icon: <ThunderboltOutlined style={{ color: '#faad14' }} /> },
  operation: { label: 'Operation', color: '#eb2f96', icon: <HddOutlined style={{ color: '#eb2f96' }} /> },
};

// ── Types ────────────────────────────────────────────────────────────────────

interface TimelineItem {
  id: string;
  scopeId: string;
  name: string;
  type: string;
  start: number;
  end: number;
  elapsed: number;
  rows: number;
  diskRead: number;
  diskWrite: number;
  memory: number;
  label?: string;
  fileName?: string;
  rawData: any;
}

interface Filters {
  scopeTypes: string[];
  minElapsed: number | null;
  maxElapsed: number | null;
  minRows: number | null;
  maxRows: number | null;
}

const defaultFilters: Filters = {
  scopeTypes: ['graph', 'subgraph', 'activity', 'operation'],
  minElapsed: null,
  maxElapsed: null,
  minRows: null,
  maxRows: null,
};

// ── Data Processing ──────────────────────────────────────────────────────────

// ── Attribute Formatting ─────────────────────────────────────────────────────

function formatAttributeValue(key: string, value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  const k = key.toLowerCase();
  const num = Number(value);
  if (!isNaN(num) && String(value).trim() !== '') {
    if (/size|bytes|memory|disk|read|write/.test(k)) return formatBytes(num);
    if (/time|elapsed|latency|duration/.test(k)) return formatSeconds(num);
    if (/num|count|rows|records/.test(k)) return formatNumber(num);
  }
  return String(value);
}

function processTimelineData(details: any[]): TimelineItem[] {
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
        rows: Number(d.NumRowsProcessed || 0),
        diskRead: Number(d.SizeDiskRead || 0),
        diskWrite: Number(d.SizeDiskWrite || 0),
        memory: Number(d.PeakMemoryUsage || 0),
        label: d.label,
        fileName: d.fileName,
        rawData: d,
      };
    })
    .filter(item => item.elapsed > 0);

  return items.sort((a, b) => a.start - b.start);
}

function identifyCriticalPath(items: TimelineItem[], topN = 10): string[] {
  return [...items]
    .sort((a, b) => b.elapsed - a.elapsed)
    .slice(0, topN)
    .map(item => item.id);
}

function groupByGraph(items: TimelineItem[]): Map<string, TimelineItem[]> {
  const groups = new Map<string, TimelineItem[]>();

  items.forEach(item => {
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
    groups.get(graphKey)!.push(item);
  });

  return groups;
}

// ── Row Component for Virtualized List ───────────────────────────────────────

interface TimelineRowData {
  items: TimelineItem[];
  timelineBounds: { min: number; max: number; duration: number };
  criticalPathIds: string[];
  highlightMode: 'none' | 'critical' | 'slow';
  onItemClick: (item: TimelineItem) => void;
}

const TimelineRow = ({
  index,
  style,
  items,
  timelineBounds,
  criticalPathIds,
  highlightMode,
  onItemClick,
}: RowComponentProps<TimelineRowData>): React.ReactElement | null => {
  const item = items[index];
  if (!item) return null;

  const { min, max } = timelineBounds;
  const totalSpan = max - min;

  const leftPercent = totalSpan > 0 ? ((item.start - min) / totalSpan) * 100 : 0;
  const widthPercent = totalSpan > 0 ? Math.max((item.elapsed / totalSpan) * 100, 0.5) : 100;

  const isHighlighted =
    highlightMode === 'critical'
      ? criticalPathIds.includes(item.id)
      : highlightMode === 'slow'
        ? item.elapsed >= timelineBounds.duration * 0.1
        : false;

  const config = SCOPE_CONFIG[item.type] || SCOPE_CONFIG.activity;

  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
        backgroundColor: 'transparent',
        transition: 'background-color 0.15s ease',
      }}
      onClick={() => onItemClick(item)}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = '#fafafa';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}>
      {/* Name Column */}
      <div style={{ width: '25%', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{ flexShrink: 0 }}>{config.icon}</span>
        <Tooltip title={item.name}>
          <Text
            ellipsis
            style={{
              fontSize: 12,
              fontWeight: isHighlighted ? 600 : 400,
              flex: 1,
              minWidth: 0,
            }}>
            {item.name}
          </Text>
        </Tooltip>
      </div>

      {/* Timeline Bar Column */}
      <div style={{ width: '55%', padding: '0 8px' }}>
        <div
          style={{
            position: 'relative',
            height: 20,
            background: '#f5f5f5',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
          <Tooltip title={`${formatSeconds(item.elapsed)} | ${formatNumber(item.rows)} rows`}>
            <div
              style={{
                position: 'absolute',
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                minWidth: 4,
                height: '100%',
                background: config.color,
                opacity: isHighlighted ? 1 : 0.7,
                border: isHighlighted ? '2px solid #000' : 'none',
                borderRadius: 2,
                transition: 'all 0.2s',
              }}
            />
          </Tooltip>
        </div>
      </div>

      {/* Duration & Rows Column */}
      <div style={{ width: '20%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
        <Text
          type="secondary"
          style={{
            fontSize: 11,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            backgroundColor: '#f5f5f5',
            padding: '2px 6px',
            borderRadius: 4,
          }}>
          <ClockCircleOutlined style={{ fontSize: 10 }} />
          {formatSeconds(item.elapsed)}
        </Text>
        {item.rows > 0 && (
          <Text
            type="secondary"
            style={{
              fontSize: 11,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              backgroundColor: '#f5f5f5',
              padding: '2px 6px',
              borderRadius: 4,
            }}>
            <DatabaseOutlined style={{ fontSize: 10 }} />
            {formatNumber(item.rows)}
          </Text>
        )}
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────

interface Props {
  wu?: any;
  details: any[];
  clusterName?: string;
}

const TimelinePanel: React.FC<Props> = ({ wu, details, clusterName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'swim-lanes'>('timeline');
  const [highlightMode, setHighlightMode] = useState<'none' | 'critical' | 'slow'>('none');
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);

  // Process data
  const allItems = useMemo(() => processTimelineData(details), [details]);

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Scope type filter
      if (!filters.scopeTypes.includes(item.type)) return false;

      // Text search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const searchText = `${item.name} ${item.label || ''} ${item.fileName || ''}`.toLowerCase();
        if (!searchText.includes(term)) return false;
      }

      // Elapsed time filter
      if (filters.minElapsed !== null && item.elapsed < filters.minElapsed) return false;
      if (filters.maxElapsed !== null && item.elapsed > filters.maxElapsed) return false;

      // Rows filter
      if (filters.minRows !== null && item.rows < filters.minRows) return false;
      if (filters.maxRows !== null && item.rows > filters.maxRows) return false;

      return true;
    });
  }, [allItems, filters, searchTerm]);

  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    if (filteredItems.length === 0) return { min: 0, max: 0, duration: 0 };

    let min = Infinity;
    let max = -Infinity;

    for (const item of filteredItems) {
      if (item.start < min) min = item.start;
      if (item.end > max) max = item.end;
    }

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
    let slowestItem: TimelineItem | null = null;

    filteredItems.forEach(item => {
      totalRows += item.rows;
      totalDiskRead += item.diskRead;
      totalDiskWrite += item.diskWrite;
      maxMemory = Math.max(maxMemory, item.memory);

      if (!slowestItem || item.elapsed > slowestItem.elapsed) {
        slowestItem = item;
      }
    });

    return { count: filteredItems.length, totalRows, totalDiskRead, totalDiskWrite, maxMemory, slowestItem };
  }, [filteredItems]);

  // Identify critical path
  const criticalPathIds = useMemo(() => identifyCriticalPath(filteredItems, 10), [filteredItems]);

  // Group by graph for swim lane view
  const graphGroups = useMemo(() => groupByGraph(filteredItems), [filteredItems]);

  const handleItemClick = useCallback((item: TimelineItem) => {
    setSelectedItem(item);
  }, []);

  const rowProps = useMemo<TimelineRowData>(
    () => ({
      items: filteredItems,
      timelineBounds,
      criticalPathIds,
      highlightMode,
      onItemClick: handleItemClick,
    }),
    [filteredItems, timelineBounds, criticalPathIds, highlightMode, handleItemClick]
  );

  const hasActiveFilters =
    filters.scopeTypes.length < 4 ||
    filters.minElapsed !== null ||
    filters.maxElapsed !== null ||
    filters.minRows !== null ||
    filters.maxRows !== null;

  // Render swim lane view (non-virtualized for grouped display)
  const renderSwimLanes = () => {
    const lanes = Array.from(graphGroups.entries());
    return (
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {lanes.map(([graphKey, items]) => (
          <Card
            key={graphKey}
            size="small"
            title={
              <Space>
                <Text strong>{graphKey}</Text>
                <Tag>{items.length} scopes</Tag>
              </Space>
            }
            styles={{ body: { padding: 0 } }}>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {items.map(item => {
                const config = SCOPE_CONFIG[item.type] || SCOPE_CONFIG.activity;
                const { min, max } = timelineBounds;
                const totalSpan = max - min;
                const leftPercent = totalSpan > 0 ? ((item.start - min) / totalSpan) * 100 : 0;
                const widthPercent = totalSpan > 0 ? Math.max((item.elapsed / totalSpan) * 100, 0.5) : 100;

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '6px 12px',
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedItem(item)}>
                    <div style={{ width: '30%', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {config.icon}
                      <Text ellipsis style={{ fontSize: 12 }}>
                        {item.name}
                      </Text>
                    </div>
                    <div style={{ width: '50%', padding: '0 8px' }}>
                      <div style={{ position: 'relative', height: 16, background: '#f5f5f5', borderRadius: 4 }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            minWidth: 4,
                            height: '100%',
                            background: config.color,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ width: '20%', textAlign: 'right' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {formatSeconds(item.elapsed)}
                      </Text>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </Space>
    );
  };

  if (!details || details.length === 0) {
    return <Empty description="No timeline data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* Job Header */}
      <Card>
        <div>
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

          <Divider size="small" />

          <Space
            wrap
            size="small"
            style={{
              marginTop: '16px',
              width: '100%',
              justifyContent: 'space-between',
            }}>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic
                title="Total Runtime"
                value={formatHours(wu?.totalClusterTime)}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ fontSize: '1.2rem' }}
              />
            </Card>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic title="Total Cost" value={formatCurrency(wu?.totalCost)} valueStyle={{ fontSize: '1.2rem' }} />
            </Card>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic
                title="Total Scopes"
                value={statistics.count}
                prefix={<BarChartOutlined />}
                valueStyle={{ fontSize: '1.2rem' }}
              />
            </Card>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic
                title="Execution Time"
                value={formatSeconds(timelineBounds.duration)}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ fontSize: '1.2rem' }}
              />
            </Card>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic
                title="Rows Processed"
                value={formatNumber(statistics.totalRows)}
                prefix={<DatabaseOutlined />}
                valueStyle={{ fontSize: '1.2rem' }}
              />
            </Card>
            <Card size="small" styles={{ body: { textAlign: 'center', minWidth: '120px' } }}>
              <Statistic
                title="Peak Memory"
                value={formatBytes(statistics.maxMemory)}
                prefix={<HddOutlined />}
                valueStyle={{ fontSize: '1.2rem' }}
              />
            </Card>
          </Space>
        </div>
      </Card>

      {/* Performance Alert */}
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
          type="warning"
          showIcon={false}
        />
      )}

      {/* Timeline Visualization */}
      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            <span>Execution Timeline</span>
            <Tag style={{ marginLeft: 8, fontWeight: 'normal' }}>{filteredItems.length} items</Tag>
          </Space>
        }
        extra={
          <Tooltip title="Click on any bar to see detailed metrics">
            <InfoCircleOutlined />
          </Tooltip>
        }
        styles={{ body: { padding: 0 } }}>
        {/* Controls */}
        <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Search by name, label, or file..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />

            <Collapse
              ghost
              size="small"
              activeKey={filtersExpanded ? ['filters'] : []}
              onChange={keys => setFiltersExpanded(keys.includes('filters'))}
              items={[
                {
                  key: 'filters',
                  label: (
                    <Space size={4}>
                      <FilterOutlined style={{ fontSize: 12 }} />
                      <span style={{ fontSize: 13 }}>Filters</span>
                      {hasActiveFilters && (
                        <Tag color="blue" style={{ marginLeft: 4, fontSize: 11 }}>
                          Active
                        </Tag>
                      )}
                    </Space>
                  ),
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
                      {/* Scope Types */}
                      <div>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                          Scope Types
                        </Text>
                        <Checkbox.Group
                          value={filters.scopeTypes}
                          onChange={vals => setFilters(f => ({ ...f, scopeTypes: vals as string[] }))}
                          style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {Object.entries(SCOPE_CONFIG).map(([type, config]) => (
                            <Checkbox key={type} value={type} style={{ marginRight: 0 }}>
                              <Tag color={config.color} style={{ margin: 0, cursor: 'pointer' }}>
                                {config.label}
                              </Tag>
                            </Checkbox>
                          ))}
                        </Checkbox.Group>
                      </div>

                      {/* Elapsed Time Range */}
                      <div>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                          Elapsed Time (seconds)
                        </Text>
                        <Space size={8}>
                          <InputNumber
                            size="small"
                            placeholder="Min"
                            min={0}
                            value={filters.minElapsed}
                            onChange={val => setFilters(f => ({ ...f, minElapsed: val }))}
                            style={{ width: 80 }}
                          />
                          <Text type="secondary">to</Text>
                          <InputNumber
                            size="small"
                            placeholder="Max"
                            min={0}
                            value={filters.maxElapsed}
                            onChange={val => setFilters(f => ({ ...f, maxElapsed: val }))}
                            style={{ width: 80 }}
                          />
                        </Space>
                      </div>

                      {/* Rows Range */}
                      <div>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                          Rows Processed
                        </Text>
                        <Space size={8}>
                          <InputNumber
                            size="small"
                            placeholder="Min"
                            min={0}
                            value={filters.minRows}
                            onChange={val => setFilters(f => ({ ...f, minRows: val }))}
                            style={{ width: 80 }}
                          />
                          <Text type="secondary">to</Text>
                          <InputNumber
                            size="small"
                            placeholder="Max"
                            min={0}
                            value={filters.maxRows}
                            onChange={val => setFilters(f => ({ ...f, maxRows: val }))}
                            style={{ width: 80 }}
                          />
                        </Space>
                      </div>

                      {/* Reset */}
                      <div>
                        <Tag style={{ cursor: 'pointer' }} onClick={() => setFilters(defaultFilters)}>
                          Reset Filters
                        </Tag>
                      </div>
                    </div>
                  ),
                },
              ]}
            />

            <Row gutter={16}>
              <Col span={12}>
                <Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    View:
                  </Text>
                  <Segmented
                    size="small"
                    value={viewMode}
                    onChange={v => setViewMode(v as 'timeline' | 'swim-lanes')}
                    options={[
                      { label: 'Timeline', value: 'timeline' },
                      { label: 'Swim Lanes', value: 'swim-lanes' },
                    ]}
                  />
                </Space>
              </Col>
              <Col span={12}>
                <Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Highlight:
                  </Text>
                  <Segmented
                    size="small"
                    value={highlightMode}
                    onChange={v => setHighlightMode(v as 'none' | 'critical' | 'slow')}
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
        </div>

        {/* Timeline Scale Header */}
        {filteredItems.length > 0 && viewMode === 'timeline' && (
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '25%' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Scope
                </Text>
              </div>
              <div style={{ width: '55%', padding: '0 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8c8c8c' }}>
                  <span>{formatSeconds(timelineBounds.min)}</span>
                  <span>{formatSeconds((timelineBounds.min + timelineBounds.max) / 2)}</span>
                  <span>{formatSeconds(timelineBounds.max)}</span>
                </div>
              </div>
              <div style={{ width: '20%', textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Duration / Rows
                </Text>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Content */}
        {filteredItems.length === 0 ? (
          <div style={{ padding: 24 }}>
            <Empty description="No items match your filters" />
          </div>
        ) : viewMode === 'timeline' ? (
          <div style={{ height: 450 }}>
            <List
              rowCount={filteredItems.length}
              rowHeight={40}
              rowComponent={TimelineRow}
              rowProps={rowProps}
              style={{ height: '100%' }}
            />
          </div>
        ) : (
          <div style={{ padding: 12, maxHeight: 500, overflowY: 'auto' }}>{renderSwimLanes()}</div>
        )}

        {/* Footer */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Showing {filteredItems.length} of {allItems.length} scopes
          </Text>
        </div>
      </Card>

      {/* Details Drawer */}
      <Drawer
        title={
          selectedItem && (
            <Space>
              {SCOPE_CONFIG[selectedItem.type]?.icon}
              <span>{selectedItem.name}</span>
            </Space>
          )
        }
        placement="right"
        open={!!selectedItem}
        width={500}
        onClose={() => setSelectedItem(null)}>
        {selectedItem && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small" title="Performance Metrics">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Duration"
                    value={formatSeconds(selectedItem.elapsed)}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Rows Processed"
                    value={formatNumber(selectedItem.rows)}
                    prefix={<DatabaseOutlined />}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Disk Read"
                    value={formatBytes(selectedItem.diskRead)}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Disk Write"
                    value={formatBytes(selectedItem.diskWrite)}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Peak Memory"
                    value={formatBytes(selectedItem.memory)}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Type"
                    value={SCOPE_CONFIG[selectedItem.type]?.label || selectedItem.type}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
              </Row>
            </Card>

            <Card size="small" title="All Attributes">
              <Descriptions column={1} size="small" bordered>
                {Object.entries(selectedItem.rawData)
                  .filter(([k, v]) => v != null && !['children', 'key'].includes(k))
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([k, v]) => (
                    <Descriptions.Item key={k} label={k}>
                      <Text copyable={{ text: String(v) }} style={{ fontSize: 12 }}>
                        {formatAttributeValue(k, v)}
                      </Text>
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
