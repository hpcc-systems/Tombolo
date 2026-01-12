import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Input,
  Select,
  Checkbox,
  Button,
  Divider,
  Table,
  Tag,
  Tooltip,
  Drawer,
  Descriptions,
  InputNumber,
  Dropdown,
  Menu,
} from 'antd';
import {
  SearchOutlined,
  ColumnHeightOutlined,
  SettingOutlined,
  SlidersOutlined,
  AppstoreOutlined,
  BarsOutlined,
} from '@ant-design/icons';
import { formatSeconds, formatNumber, formatBytes, renderAnyMetric } from '@tombolo/shared';
import styles from './workunitHistory.module.css';
import { loadLocalStorage, saveLocalStorage } from '@tombolo/shared/browser';
import { flattenTree } from './common';

const { Option } = Select;
const { Item: MenuItem, ItemGroup: MenuItemGroup } = Menu;
const { Group: CheckboxGroup } = Checkbox;

const defaultVisible = [
  'scopeName',
  'scopeType',
  'label',
  'fileName',
  'TimeElapsed',
  'TimeTotalExecute',
  'NumRowsProcessed',
  'SizeDiskRead',
  'SizeDiskWrite',
  'PeakMemoryUsage',
];

const AllMetricsPanel = ({ wu, details }) => {
  // Preferences
  const [density, setDensity] = useState(loadLocalStorage('wuh.metrics.density', 'middle'));
  const [pageSize, setPageSize] = useState(loadLocalStorage('wuh.metrics.pageSize', 50));
  const [visibleCols, setVisibleCols] = useState(loadLocalStorage('wuh.metrics.visibleCols', defaultVisible));
  const [groupMode, setGroupMode] = useState(loadLocalStorage('wuh.metrics.groupMode', 'flat')); // flat | grouped

  useEffect(() => saveLocalStorage('wuh.metrics.density', density), [density]);
  useEffect(() => saveLocalStorage('wuh.metrics.pageSize', pageSize), [pageSize]);
  useEffect(() => saveLocalStorage('wuh.metrics.visibleCols', visibleCols), [visibleCols]);
  useEffect(() => saveLocalStorage('wuh.metrics.groupMode', groupMode), [groupMode]);

  // Filters
  const [q, setQ] = useState('');
  const [types, setTypes] = useState(['activity', 'subgraph', 'graph', 'operation']);
  const [file, setFile] = useState(undefined);
  const [range, setRange] = useState({
    TimeElapsed: [undefined, undefined],
    NumRowsProcessed: [undefined, undefined],
    PeakMemoryUsage: [undefined, undefined],
  });

  const onRangeChange = (key, idx, val) => {
    setRange(r => ({ ...r, [key]: idx === 0 ? [val, r[key][1]] : [r[key][0], val] }));
  };

  // Options gathered from data
  const fileOptions = useMemo(() => {
    const set = new Set();
    details.forEach(d => d.fileName && set.add(d.fileName));
    return Array.from(set).sort();
  }, [details]);

  // Build grouped tree when needed
  const treeData = useMemo(() => {
    if (groupMode !== 'grouped') return null;
    const map = new Map();
    const roots = [];
    details.forEach(d => {
      const key = d.scopeId || d.scopeName;
      map.set(key, { ...d, key, children: [] });
    });
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
  }, [details, groupMode]);

  // Filtering
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rng = range;
    const byFlat = d => {
      if (!types.includes(d.scopeType)) return false;
      if (file && d.fileName !== file) return false;
      if (term) {
        const s = `${d.scopeName || ''} ${d.label || ''} ${d.fileName || ''}`.toLowerCase();
        if (!s.includes(term)) return false;
      }
      // numeric ranges
      const inRange = (val, [min, max]) => (min == null || (val ?? 0) >= min) && (max == null || (val ?? 0) <= max);
      if (!inRange(d.TimeElapsed, rng.TimeElapsed)) return false;
      if (!inRange(d.NumRowsProcessed, rng.NumRowsProcessed)) return false;
      if (!inRange(d.PeakMemoryUsage, rng.PeakMemoryUsage)) return false;
      return true;
    };
    if (groupMode === 'flat') return details.filter(byFlat);
    // grouped: filter leaves but keep parents that have any matching descendant
    const clone = node => ({ ...node, children: node.children?.map(clone) || [] });
    const roots = (treeData || []).map(clone);
    const prune = node => {
      const match = byFlat(node);
      node.children = node.children.map(prune).filter(Boolean);
      return match || node.children.length ? node : null;
    };
    return roots.map(prune).filter(Boolean);
  }, [details, treeData, groupMode, q, types, file, range]);

  // Aggregates for header
  const summary = useMemo(() => {
    const list = groupMode === 'flat' ? filtered : flattenTree(filtered);
    let count = 0,
      rows = 0,
      diskR = 0,
      diskW = 0,
      maxMem = 0,
      totalElapsed = 0;
    list.forEach(d => {
      count += 1;
      rows += Number(d.NumRowsProcessed || 0);
      diskR += Number(d.SizeDiskRead || 0);
      diskW += Number(d.SizeDiskWrite || 0);
      maxMem = Math.max(maxMem, Number(d.PeakMemoryUsage || 0));
      totalElapsed += Number(d.TimeElapsed || 0);
    });
    return { count, rows, diskR, diskW, maxMem, totalElapsed };
  }, [filtered, groupMode]);

  // Columns
  const columns = useMemo(() => {
    const base = [];
    if (visibleCols.includes('scopeName'))
      base.push({
        title: 'Scope Name',
        dataIndex: 'scopeName',
        key: 'scopeName',
        ellipsis: true,
        render: (v, r) => (
          <Space size={4}>
            <Tag color="blue" className={styles.tagCapitalize}>
              {r.scopeType}
            </Tag>
            <span>{v}</span>
          </Space>
        ),
      });
    if (visibleCols.includes('label')) base.push({ title: 'Label', dataIndex: 'label', key: 'label', ellipsis: true });
    if (visibleCols.includes('fileName'))
      base.push({ title: 'File', dataIndex: 'fileName', key: 'fileName', ellipsis: true });
    if (visibleCols.includes('TimeElapsed'))
      base.push({
        title: () => (
          <Tooltip title="Elapsed wall time">
            <span>Elapsed</span>
          </Tooltip>
        ),
        dataIndex: 'TimeElapsed',
        key: 'TimeElapsed',
        align: 'right',
        render: v => <span className={styles.numericText}>{formatSeconds(v)}</span>,
        sorter: (a, b) => (a.TimeElapsed || 0) - (b.TimeElapsed || 0),
      });
    if (visibleCols.includes('TimeTotalExecute'))
      base.push({
        title: 'Execute',
        dataIndex: 'TimeTotalExecute',
        key: 'TimeTotalExecute',
        align: 'right',
        render: v => <span className={styles.numericText}>{formatSeconds(v)}</span>,
        sorter: (a, b) => (a.TimeTotalExecute || 0) - (b.TimeTotalExecute || 0),
      });
    if (visibleCols.includes('NumRowsProcessed'))
      base.push({
        title: 'Rows',
        dataIndex: 'NumRowsProcessed',
        key: 'NumRowsProcessed',
        align: 'right',
        render: v => <span className={styles.numericText}>{formatNumber(v)}</span>,
        sorter: (a, b) => (a.NumRowsProcessed || 0) - (b.NumRowsProcessed || 0),
      });
    if (visibleCols.includes('SizeDiskRead'))
      base.push({
        title: 'Disk Read',
        dataIndex: 'SizeDiskRead',
        key: 'SizeDiskRead',
        align: 'right',
        render: v => <span className={styles.numericText}>{formatBytes(v)}</span>,
        sorter: (a, b) => (a.SizeDiskRead || 0) - (b.SizeDiskRead || 0),
      });
    if (visibleCols.includes('SizeDiskWrite'))
      base.push({
        title: 'Disk Write',
        dataIndex: 'SizeDiskWrite',
        key: 'SizeDiskWrite',
        align: 'right',
        render: v => <span className={styles.numericText}>{formatBytes(v)}</span>,
        sorter: (a, b) => (a.SizeDiskWrite || 0) - (b.SizeDiskWrite || 0),
      });
    if (visibleCols.includes('PeakMemoryUsage'))
      base.push({
        title: 'Memory',
        dataIndex: 'PeakMemoryUsage',
        key: 'PeakMemoryUsage',
        align: 'right',
        render: v => <span className={styles.numericText}>{formatBytes(v)}</span>,
        sorter: (a, b) => (a.PeakMemoryUsage || 0) - (b.PeakMemoryUsage || 0),
      });
    return base;
  }, [visibleCols]);

  const [selected, setSelected] = useState(null);

  // Table dataSource depending on mode
  const dataSource = useMemo(() => {
    if (groupMode === 'flat') {
      return filtered.map((d, idx) => ({ key: d.scopeId || d.scopeName || idx, ...d }));
    }
    const markKeys = nodes => {
      return nodes.map((n, idx) => ({
        key: n.scopeId || n.scopeName || idx,
        ...n,
        children: n.children ? markKeys(n.children) : undefined,
      }));
    };
    return markKeys(filtered);
  }, [filtered, groupMode]);

  const columnMenu = (
    <Menu className={styles.menuScrollable}>
      <MenuItemGroup title="Columns">
        {[
          ['scopeName', 'Scope Name'],
          ['label', 'Label'],
          ['fileName', 'File'],
          ['TimeElapsed', 'Elapsed'],
          ['TimeTotalExecute', 'Execute'],
          ['NumRowsProcessed', 'Rows'],
          ['SizeDiskRead', 'Disk Read'],
          ['SizeDiskWrite', 'Disk Write'],
          ['PeakMemoryUsage', 'Memory'],
        ].map(([key, label]) => (
          <MenuItem key={key} className={styles.menuItemTight}>
            <Checkbox
              className={styles.menuCheckboxFull}
              checked={visibleCols.includes(key)}
              onChange={e => {
                setVisibleCols(prev => {
                  const set = new Set(prev);
                  if (e.target.checked) set.add(key);
                  else set.delete(key);
                  return Array.from(set);
                });
              }}>
              {label}
            </Checkbox>
          </MenuItem>
        ))}
      </MenuItemGroup>
      <Divider className={styles.dividerTighter} />
      <MenuItemGroup title="Density">
        {[
          ['large', 'Comfortable'],
          ['middle', 'Default'],
          ['small', 'Compact'],
        ].map(([val, label]) => (
          <MenuItem key={val} onClick={() => setDensity(val)}>
            <Space>
              <ColumnHeightOutlined /> {label}
              {density === val && <Tag color="blue">selected</Tag>}
            </Space>
          </MenuItem>
        ))}
      </MenuItemGroup>
    </Menu>
  );

  return (
    <Space direction="vertical" size={16} className={styles.fullWidth}>
      {/* KPI header */}
      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Statistic title="Items" value={summary.count} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Statistic title="Total Elapsed" valueRender={() => <span>{formatSeconds(summary.totalElapsed)}</span>} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Statistic title="Rows" valueRender={() => <span>{formatNumber(summary.rows)}</span>} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Statistic title="Max Memory" valueRender={() => <span>{formatBytes(summary.maxMem)}</span>} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Statistic title="Disk Read" valueRender={() => <span>{formatBytes(summary.diskR)}</span>} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Statistic title="Disk Write" valueRender={() => <span>{formatBytes(summary.diskW)}</span>} />
          </Col>
        </Row>
      </Card>

      {/* Filters + controls */}
      <Card>
        <div className={styles.justifyBetween}>
          <Space size={12} wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search name, label, file"
              className={styles.w280}
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <Select allowClear placeholder="File" className={styles.w200} value={file} onChange={setFile}>
              {fileOptions.map(f => (
                <Option key={f} value={f}>
                  {f}
                </Option>
              ))}
            </Select>
            <CheckboxGroup
              options={[
                { label: 'Graph', value: 'graph' },
                { label: 'Subgraph', value: 'subgraph' },
                { label: 'Activity', value: 'activity' },
                { label: 'Operation', value: 'operation' },
              ]}
              value={types}
              onChange={setTypes}
            />
            <Divider type="vertical" />
            <Space size={8}>
              <SlidersOutlined />
              <span>Elapsed</span>
              <InputNumber
                placeholder="min s"
                value={range.TimeElapsed[0]}
                onChange={v => onRangeChange('TimeElapsed', 0, v)}
                min={0}
              />
              <InputNumber
                placeholder="max s"
                value={range.TimeElapsed[1]}
                onChange={v => onRangeChange('TimeElapsed', 1, v)}
                min={0}
              />
            </Space>
            <Space size={8}>
              <span>Rows</span>
              <InputNumber
                placeholder="min"
                value={range.NumRowsProcessed[0]}
                onChange={v => onRangeChange('NumRowsProcessed', 0, v)}
                min={0}
              />
              <InputNumber
                placeholder="max"
                value={range.NumRowsProcessed[1]}
                onChange={v => onRangeChange('NumRowsProcessed', 1, v)}
                min={0}
              />
            </Space>
            <Space size={8}>
              <span>Memory</span>
              <InputNumber
                placeholder="min B"
                value={range.PeakMemoryUsage[0]}
                onChange={v => onRangeChange('PeakMemoryUsage', 0, v)}
                min={0}
              />
              <InputNumber
                placeholder="max B"
                value={range.PeakMemoryUsage[1]}
                onChange={v => onRangeChange('PeakMemoryUsage', 1, v)}
                min={0}
              />
            </Space>
          </Space>
          <Space>
            <Button
              icon={groupMode === 'flat' ? <BarsOutlined /> : <AppstoreOutlined />}
              onClick={() => setGroupMode(m => (m === 'flat' ? 'grouped' : 'flat'))}>
              {groupMode === 'flat' ? 'Flat' : 'Grouped'}
            </Button>
            <Dropdown overlay={columnMenu} trigger={['click']} placement="bottomRight">
              <Button icon={<SettingOutlined />}>Columns</Button>
            </Dropdown>
          </Space>
        </div>
      </Card>

      {/* Results */}
      <Card className={styles.cardNoBodyPadding}>
        <Table
          size={density}
          sticky
          pagination={{
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: [25, 50, 100, 200, 500],
            onChange: (_p, _ps) => {
              if (_ps !== pageSize) setPageSize(_ps);
            },
          }}
          onRow={record => ({
            onClick: () => setSelected(record),
          })}
          columns={columns}
          dataSource={dataSource}
          scroll={{ x: 'max-content', y: 560 }}
          rowKey="key"
          expandable={groupMode === 'grouped' ? { defaultExpandAllRows: false } : undefined}
        />
      </Card>

      <Drawer
        title={selected?.scopeName}
        placement="right"
        open={!!selected}
        width={520}
        onClose={() => setSelected(null)}>
        {selected && (
          <Descriptions column={1} size="small" bordered>
            {Object.entries(selected)
              .filter(([k, v]) => v != null && !['key', 'children', 'scopeId'].includes(k))
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


export default AllMetricsPanel;
