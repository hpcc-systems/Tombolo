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
  Select,
  Button,
  Drawer,
  Descriptions,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  FieldTimeOutlined,
  ColumnHeightOutlined,
  ReloadOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { Bar } from '@ant-design/plots';
import { formatSeconds, formatNumber, formatBytes, renderAnyMetric } from '@tombolo/shared';
import { loadLocalStorage, saveLocalStorage } from '@tombolo/shared/browser';
import styles from './workunitHistory.module.css';

const { Option } = Select;

const SCOPE_TYPES = ['graph', 'subgraph', 'activity', 'operation'];

// Top-level graph key from scopeId like G1:SG2:A3
function getGraphKey(scopeId, scopeType) {
  if (!scopeId) return scopeType === 'graph' ? scopeId || 'GRAPH' : 'UNGROUPED';
  const idx = scopeId.indexOf(':');
  return idx === -1 ? scopeId : scopeId.slice(0, idx);
}

// Build items for plotting
function toItems(details) {
  return details
    .map((d, i) => {
      const start = d.TimeFirstRow != null ? Number(d.TimeFirstRow) : 0;
      const dur = d.TimeElapsed != null ? Number(d.TimeElapsed) : 0;
      const end = start + dur;
      return {
        id: d.scopeId || d.scopeName || `row-${i}`,
        name: d.scopeName,
        scopeType: d.scopeType,
        label: d.label,
        fileName: d.fileName,
        start,
        end,
        duration: dur,
        graphKey: getGraphKey(d.scopeId, d.scopeType),
        raw: d,
      };
    })
    .filter(r => r.duration > 0);
}

const COLORS = {
  graph: '#2f54eb',
  subgraph: '#13c2c2',
  activity: '#52c41a',
  operation: '#fa8c16',
};

const TimelinePanel = ({ wu, details }) => {
  // Preferences / UI state
  const [types, setTypes] = useState(loadLocalStorage('wuh.timeline.types', SCOPE_TYPES));
  const [q, setQ] = useState(loadLocalStorage('wuh.timeline.q', ''));
  const [minElapsed, setMinElapsed] = useState(loadLocalStorage('wuh.timeline.minElapsed', 0));
  const [mode, setMode] = useState(loadLocalStorage('wuh.timeline.mode', 'flat')); // 'flat' | 'by-graph'
  const [density, setDensity] = useState(loadLocalStorage('wuh.timeline.density', 'middle')); // large | middle | small
  const [pageSize, setPageSize] = useState(loadLocalStorage('wuh.timeline.pageSize', 50));
  const [page, setPage] = useState(1);
  const [graphKey, setGraphKey] = useState(loadLocalStorage('wuh.timeline.graphKey', ''));
  const [selected, setSelected] = useState(null);

  useEffect(() => saveLocalStorage('wuh.timeline.types', types), [types]);
  useEffect(() => saveLocalStorage('wuh.timeline.q', q), [q]);
  useEffect(() => saveLocalStorage('wuh.timeline.minElapsed', minElapsed), [minElapsed]);
  useEffect(() => saveLocalStorage('wuh.timeline.mode', mode), [mode]);
  useEffect(() => saveLocalStorage('wuh.timeline.density', density), [density]);
  useEffect(() => saveLocalStorage('wuh.timeline.pageSize', pageSize), [pageSize]);
  useEffect(() => saveLocalStorage('wuh.timeline.graphKey', graphKey), [graphKey]);

  const items = useMemo(() => toItems(details || []), [details]);

  // Filter base
  const term = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    return items.filter(it => {
      if (!types.includes(it.scopeType)) return false;
      if (minElapsed && it.duration < Number(minElapsed)) return false;
      if (term) {
        const s = `${it.name || ''} ${it.label || ''} ${it.fileName || ''}`.toLowerCase();
        if (!s.includes(term)) return false;
      }
      return true;
    });
  }, [items, types, minElapsed, term]);

  // Graph list
  const graphKeys = useMemo(() => {
    const set = new Set();
    filtered.forEach(i => set.add(i.graphKey || 'UNGROUPED'));
    return Array.from(set).sort();
  }, [filtered]);

  // Data for the chart view
  const chartData = useMemo(() => {
    const source =
      mode === 'by-graph' && graphKey ? filtered.filter(i => (i.graphKey || 'UNGROUPED') === graphKey) : filtered;
    return source.map(r => ({
      name: r.name,
      type: r.scopeType,
      start: r.start,
      end: r.end,
      duration: r.end - r.start,
      id: r.id,
      raw: r.raw,
    }));
  }, [filtered, mode, graphKey]);

  // Pagination for rows (y categories) to avoid plotting 10k bars at once
  const totalRows = chartData.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageData = chartData.slice(pageStart, pageStart + pageSize);

  // Overall span for axis
  const totalSpan = useMemo(() => {
    let maxEnd = 0;
    filtered.forEach(it => {
      if (it.end > maxEnd) maxEnd = it.end;
    });
    if (wu?.totalClusterTime != null) maxEnd = Math.max(maxEnd, Number(wu.totalClusterTime));
    return maxEnd;
  }, [filtered, wu]);

  // KPI summary
  const summary = useMemo(() => {
    let rows = 0,
      diskR = 0,
      diskW = 0,
      maxMem = 0;
    filtered.forEach(it => {
      const d = it.raw;
      rows += Number(d.NumRowsProcessed || 0);
      diskR += Number(d.SizeDiskRead || 0);
      diskW += Number(d.SizeDiskWrite || 0);
      maxMem = Math.max(maxMem, Number(d.PeakMemoryUsage || 0));
    });
    return { count: filtered.length, rows, diskR, diskW, maxMem };
  }, [filtered]);

  // Chart height based on density and rows on page
  const rowH = density === 'small' ? 18 : density === 'large' ? 28 : 22;
  const chartHeight = Math.max(160, 80 + pageData.length * rowH);

  // Build stacked bar data to emulate a Gantt offset: an invisible "offset" segment + a colored "duration" segment
  const barData = useMemo(() => {
    const rows = [];
    for (const d of pageData) {
      const offsetVal = Math.max(0, Number(d.start) || 0);
      const durationVal = Math.max(0, Number(d.duration) || 0);
      if (offsetVal > 0) {
        rows.push({
          name: d.name,
          type: d.type,
          segment: 'offset',
          value: offsetVal,
          start: d.start,
          end: d.end,
          id: d.id,
          raw: d.raw,
        });
      } else {
        // Include zero-offset so the stack baseline is defined
        rows.push({
          name: d.name,
          type: d.type,
          segment: 'offset',
          value: 0,
          start: d.start,
          end: d.end,
          id: d.id,
          raw: d.raw,
        });
      }
      rows.push({
        name: d.name,
        type: d.type,
        segment: 'duration',
        value: durationVal,
        start: d.start,
        end: d.end,
        id: d.id,
        raw: d.raw,
      });
    }
    return rows;
  }, [pageData]);

  const config = useMemo(
    () => ({
      data: barData,
      isStack: true,
      xField: 'value',
      yField: 'name',
      seriesField: 'segment',
      legend: false,
      color: ({ segment, type }) => (segment === 'offset' ? 'rgba(0,0,0,0)' : COLORS[type] || '#8c8c8c'),
      minColumnWidth: 6,
      maxColumnWidth: 20,
      height: chartHeight,
      xAxis: {
        min: 0,
        max: Math.max(1, totalSpan),
        label: { formatter: v => formatSeconds(Number(v)) },
        grid: { line: { style: { stroke: '#f0f0f0' } } },
      },
      yAxis: {
        label: { autoHide: true },
      },
      tooltip: {
        // Only show the duration segment with computed times
        customItems: items => items.filter(it => it.data?.segment === 'duration'),
        customContent: (_title, items) => {
          const first = items?.[0];
          if (!first) return '';
          const d = first.data;
          const dur = (Number(d.end) || 0) - (Number(d.start) || 0);
          return `
          <div style="padding:8px 12px;">
            <div style="font-weight:600; margin-bottom:4px;">${d.name}</div>
            <div>Type: ${d.type}</div>
            <div>Start: ${formatSeconds(d.start)}</div>
            <div>Duration: ${formatSeconds(dur)}</div>
            <div>End: ${formatSeconds(d.end)}</div>
          </div>`;
        },
      },
      interactions: [{ type: 'element-active' }],
      state: {
        active: { style: { stroke: '#000', lineWidth: 1 } },
      },
      animation: false,
    }),
    [barData, chartHeight, totalSpan]
  );

  const onReset = () => {
    setTypes(SCOPE_TYPES);
    setQ('');
    setMinElapsed(0);
    setMode('flat');
    setDensity('middle');
    setPageSize(50);
    setPage(1);
    setGraphKey('');
  };

  return (
    <Space direction="vertical" size={16} className={styles.fullWidth}>
      {/* KPI header */}
      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic title="Items" value={summary.count} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Total Span"
              valueRender={() => <span>{formatSeconds(totalSpan)}</span>}
              prefix={<FieldTimeOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Rows" valueRender={() => <span>{formatNumber(summary.rows)}</span>} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Max Memory" valueRender={() => <span>{formatBytes(summary.maxMem)}</span>} />
          </Col>
        </Row>
      </Card>

      {/* Controls */}
      <Card>
        <div className={styles.justifyBetween}>
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search scope, label, file"
              className={styles.w300}
              value={q}
              onChange={e => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
            <Checkbox.Group
              value={types}
              onChange={v => {
                setTypes(v);
                setPage(1);
              }}
              options={SCOPE_TYPES.map(t => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t }))}
            />
            <Space size={8}>
              <span>Min Elapsed</span>
              <InputNumber
                min={0}
                value={minElapsed}
                onChange={v => {
                  setMinElapsed(v || 0);
                  setPage(1);
                }}
                placeholder="s"
              />
            </Space>
            <Space size={8}>
              <span>Mode</span>
              <Select
                value={mode}
                onChange={v => {
                  setMode(v);
                  setPage(1);
                }}
                className={styles.w160}
                suffixIcon={<AppstoreOutlined />}>
                <Option value="flat">Flat (all scopes)</Option>
                <Option value="by-graph">By Graph (choose lane)</Option>
              </Select>
              {mode === 'by-graph' && (
                <Select
                  allowClear
                  placeholder="Graph lane"
                  className={styles.minW180}
                  value={graphKey || undefined}
                  onChange={v => {
                    setGraphKey(v || '');
                    setPage(1);
                  }}>
                  {graphKeys.map(k => (
                    <Option key={k} value={k}>
                      {k}
                    </Option>
                  ))}
                </Select>
              )}
            </Space>
          </Space>
          <Space>
            <Select value={density} onChange={setDensity} className={styles.w140} suffixIcon={<ColumnHeightOutlined />}>
              <Option value="large">Comfortable</Option>
              <Option value="middle">Default</Option>
              <Option value="small">Compact</Option>
            </Select>
            <Select
              value={pageSize}
              onChange={v => {
                setPageSize(v);
                setPage(1);
              }}
              className={styles.w120}>
              {[25, 50, 100, 200, 500].map(ps => (
                <Option key={ps} value={ps}>
                  {ps} rows
                </Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={onReset}>
              Reset
            </Button>
          </Space>
        </div>
      </Card>

      {/* Chart */}
      <Card>
        {pageData.length === 0 ? (
          <Empty description="No items match filters" />
        ) : (
          <Bar
            {...config}
            onReady={plot => {
              plot.on('element:click', evt => {
                const datum = evt?.data?.data;
                if (datum?.raw) setSelected(datum.raw);
              });
            }}
          />
        )}
        <div className={`${styles.justifyBetween} ${styles.mt12}`}>
          <div className={styles.subtleText}>
            Showing {pageData.length} of {totalRows} items
          </div>
          {totalRows > pageSize && (
            <Space>
              <Button size="small" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                Prev
              </Button>
              <span className={styles.subtleTextDark}>
                Page {currentPage} / {pageCount}
              </span>
              <Button
                size="small"
                disabled={currentPage >= pageCount}
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}>
                Next
              </Button>
            </Space>
          )}
        </div>
      </Card>

      {/* Details drawer */}
      <Drawer
        title={selected?.scopeName}
        placement="right"
        open={!!selected}
        width={520}
        onClose={() => setSelected(null)}>
        {selected && (
          <Descriptions column={1} size="small" bordered>
            {Object.entries(selected)
              .filter(([k, v]) => v != null && !['children', 'key'].includes(k))
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => (
                <Descriptions.Item key={k} label={k}>
                  {renderAnyMetric(k, v)}
                </Descriptions.Item>
              ))}
          </Descriptions>
        )}
      </Drawer>
    </Space>
  );
};

export default TimelinePanel;
