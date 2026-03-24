import React, { useCallback, useMemo, useState } from 'react';
import { List, RowComponentProps } from 'react-window';
import { Card, Checkbox, Collapse, Input, InputNumber, Select, Space, Tag, Typography } from 'antd';
import { formatLabel } from '@tombolo/shared';
import {
  SearchOutlined,
  ApartmentOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// Extracts the first camelCase word from a label, used for grouping similar labels.
// e.g. "StoreInternalValue" → "Store", "LocalActivity" → "Local"
function getLabelGroup(label: string): string {
  const match = label.match(/^([A-Z][a-z]+|[A-Z]+(?=[A-Z][a-z])|[A-Z]+$|[a-z]+)/);
  return match ? match[0] : label;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function buildScopeTree(details: any[]) {
  const map = new Map<string, any>();
  const roots: any[] = [];

  // First pass: create all nodes keyed by scopeName (the full colon-separated path)
  details.forEach(d => {
    const key = d.scopeName || d.scopeId;
    if (key) {
      map.set(key, { ...d, key, children: [] });
    }
  });

  // Second pass: build hierarchy by finding parents via colon segments in scopeName
  details.forEach(d => {
    const key = d.scopeName || d.scopeId;
    if (!key) return;

    const node = map.get(key);
    if (!node) return;

    // Try to find a parent by progressively removing the last segment
    const segments = key.split(':');
    let foundParent = false;

    // Start from removing one segment, keep trying until we find a parent or run out
    for (let i = segments.length - 1; i >= 1; i--) {
      const potentialParentKey = segments.slice(0, i).join(':');
      const parent = map.get(potentialParentKey);
      if (parent && parent !== node) {
        parent.children.push(node);
        foundParent = true;
        break;
      }
    }

    // If no parent found, this is a root node
    if (!foundParent) {
      roots.push(node);
    }
  });

  // Sort children at each level for consistent display
  const sortChildren = (nodes: any[]) => {
    nodes.sort((a, b) => {
      // Sort by scope type priority, then by name
      const typeOrder: Record<string, number> = { graph: 0, subgraph: 1, activity: 2, operation: 3 };
      const aOrder = typeOrder[a.scopeType] ?? 99;
      const bOrder = typeOrder[b.scopeType] ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.scopeName || a.key).localeCompare(b.scopeName || b.key, undefined, { numeric: true });
    });
    nodes.forEach(n => {
      if (n.children?.length) sortChildren(n.children);
    });
  };
  sortChildren(roots);

  return roots;
}

export function findPathByKey(nodes: any[], key: any): { title: string; key: any }[] {
  const stack: any[] = [];
  const dfs = (list: any[]): boolean => {
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

export function flattenTree(nodes: any[]): any[] {
  const result: any[] = [];
  const dfs = (list: any[]) => {
    for (const n of list) {
      result.push(n);
      if (n.children) dfs(n.children);
    }
  };
  dfs(nodes);
  return result;
}

// ── Component ────────────────────────────────────────────────────────────────

export interface HierarchyExplorerSelectPayload {
  node: any | null;
  breadcrumb: { title: string; key: any }[];
}

interface Filters {
  scopeTypes: string[];
  hasLabel: 'any' | 'yes' | 'no';
  activityLabels: string[];
  minElapsed: number | null;
  maxElapsed: number | null;
  minRows: number | null;
  maxRows: number | null;
}

const defaultFilters: Filters = {
  scopeTypes: ['graph', 'subgraph', 'activity', 'operation'],
  hasLabel: 'any',
  activityLabels: [],
  minElapsed: null,
  maxElapsed: null,
  minRows: null,
  maxRows: null,
};

interface HierarchyExplorerProps {
  details: any[];
  storageKeyPrefix?: string;
  onSelect?: (payload: HierarchyExplorerSelectPayload) => void;
}

interface FlatNode {
  _depth: number;
  key: any;
  scopeType?: string;
  scopeName?: string;
  label?: string;
  children?: any[];
  [key: string]: any;
}

interface RowData {
  nodes: FlatNode[];
  selectedKey: any;
  onRowClick: (node: FlatNode) => void;
}

function flattenWithDepth(tree: any[]): FlatNode[] {
  const result: FlatNode[] = [];
  const dfs = (list: any[], depth: number) => {
    for (const n of list) {
      result.push({ ...n, _depth: depth });
      if (n.children?.length) dfs(n.children, depth + 1);
    }
  };
  dfs(tree, 0);
  return result;
}

const scopeTypeColors: Record<string, string> = {
  graph: '#1677ff',
  subgraph: '#52c41a',
  activity: '#faad14',
  operation: '#eb2f96',
};

const formatElapsed = (seconds: number): string => {
  if (seconds < 0.001) return '<1ms';
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toFixed(0)}s`;
};

const formatRows = (rows: number): string => {
  if (rows >= 1_000_000) return `${(rows / 1_000_000).toFixed(1)}M`;
  if (rows >= 1_000) return `${(rows / 1_000).toFixed(1)}K`;
  return rows.toString();
};

const Row = ({
  index,
  style,
  nodes,
  selectedKey,
  onRowClick,
}: RowComponentProps<RowData>): React.ReactElement | null => {
  const node = nodes[index];
  if (!node) return null;
  const isSelected = node.key === selectedKey;
  const hasChildren = node.children && node.children.length > 0;
  const color = scopeTypeColors[node.scopeType || ''] || '#1677ff';
  const elapsed = node.TimeElapsed ? Number(node.TimeElapsed) : null;
  const rowsProcessed = node.NumRowsProcessed ? Number(node.NumRowsProcessed) : null;

  return (
    <div
      style={{
        ...style,
        cursor: 'pointer',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: isSelected ? '#e6f4ff' : 'transparent',
        borderLeft: isSelected ? '3px solid #1677ff' : '3px solid transparent',
        transition: 'all 0.15s ease',
      }}
      onClick={() => onRowClick(node)}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = '#fafafa';
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}>
      <div
        style={{ marginLeft: node._depth * 20, display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <Tag
          color={color}
          style={{
            margin: 0,
            fontSize: 11,
            textTransform: 'capitalize',
            borderRadius: 4,
            padding: '0 6px',
            lineHeight: '20px',
          }}>
          {node.scopeType}
        </Tag>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text
              strong={isSelected}
              style={{
                fontSize: 13,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
              {node.scopeName}
            </Text>
            {(elapsed !== null || rowsProcessed !== null) && (
              <Space size={8} style={{ flexShrink: 0 }}>
                {elapsed !== null && (
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 11,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      backgroundColor: '#f5f5f5',
                      padding: '1px 6px',
                      borderRadius: 4,
                    }}>
                    <ClockCircleOutlined style={{ fontSize: 10 }} />
                    {formatElapsed(elapsed)}
                  </Text>
                )}
                {rowsProcessed !== null && (
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 11,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      backgroundColor: '#f5f5f5',
                      padding: '1px 6px',
                      borderRadius: 4,
                    }}>
                    <DatabaseOutlined style={{ fontSize: 10 }} />
                    {formatRows(rowsProcessed)}
                  </Text>
                )}
              </Space>
            )}
          </div>
          {node.label && (
            <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.2 }}>
              {formatLabel(node.label)}
            </Text>
          )}
        </div>
        {hasChildren && (
          <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
            {node.children.length}
          </Text>
        )}
      </div>
    </div>
  );
};

const HierarchyExplorer: React.FC<HierarchyExplorerProps> = ({ details, onSelect }) => {
  const [selectedKey, setSelectedKey] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const treeNodes = useMemo(() => buildScopeTree(details || []), [details]);
  const allNodes = useMemo(() => flattenWithDepth(treeNodes), [treeNodes]);

  const availableActivityLabels = useMemo(() => {
    const seen = new Set<string>();
    for (const n of allNodes) {
      if (n.scopeType === 'activity' && n.label) seen.add(getLabelGroup(n.label));
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [allNodes]);

  const filteredNodes = useMemo(() => {
    return allNodes.filter(n => {
      // Text search
      if (searchText.trim()) {
        const lower = searchText.toLowerCase();
        const matchesSearch =
          n.scopeName?.toLowerCase().includes(lower) ||
          n.scopeType?.toLowerCase().includes(lower) ||
          n.label?.toLowerCase().includes(lower);
        if (!matchesSearch) return false;
      }

      // Scope type filter
      if (filters.scopeTypes.length > 0 && !filters.scopeTypes.includes(n.scopeType || '')) {
        return false;
      }

      // Has label filter
      if (filters.hasLabel === 'yes' && !n.label) return false;
      if (filters.hasLabel === 'no' && n.label) return false;

      // Activity label filter (match against the label's group prefix)
      if (filters.activityLabels.length > 0 && !filters.activityLabels.includes(getLabelGroup(n.label || ''))) {
        return false;
      }

      // Elapsed time filter
      const elapsed = Number(n.TimeElapsed || 0);
      if (filters.minElapsed !== null && elapsed < filters.minElapsed) return false;
      if (filters.maxElapsed !== null && elapsed > filters.maxElapsed) return false;

      // Rows processed filter
      const rows = Number(n.NumRowsProcessed || 0);
      if (filters.minRows !== null && rows < filters.minRows) return false;
      if (filters.maxRows !== null && rows > filters.maxRows) return false;

      return true;
    });
  }, [allNodes, searchText, filters]);

  const handleRowClick = useCallback(
    (node: FlatNode) => {
      setSelectedKey(node.key);
      onSelect?.({ node, breadcrumb: findPathByKey(treeNodes, node.key) });
    },
    [treeNodes, onSelect]
  );

  const rowProps = useMemo<RowData>(
    () => ({ nodes: filteredNodes, selectedKey, onRowClick: handleRowClick }),
    [filteredNodes, selectedKey, handleRowClick]
  );

  return (
    <Card
      title={
        <Space>
          <ApartmentOutlined />
          <span>Scope Hierarchy</span>
          <Tag style={{ marginLeft: 8, fontWeight: 'normal' }}>{filteredNodes.length} items</Tag>
        </Space>
      }
      styles={{
        body: { padding: 0 },
        header: { borderBottom: '1px solid #f0f0f0' },
      }}>
      <div style={{ padding: '12px 12px 0 12px' }}>
        <Input
          placeholder="Search scopes..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          allowClear
          style={{ marginBottom: 8 }}
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
                  {(filters.scopeTypes.length < 4 ||
                    filters.hasLabel !== 'any' ||
                    filters.activityLabels.length > 0 ||
                    filters.minElapsed !== null ||
                    filters.maxElapsed !== null ||
                    filters.minRows !== null ||
                    filters.maxRows !== null) && (
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
                      {['graph', 'subgraph', 'activity', 'operation'].map(type => (
                        <Checkbox key={type} value={type} style={{ marginRight: 0 }}>
                          <Tag
                            color={scopeTypeColors[type]}
                            style={{ margin: 0, textTransform: 'capitalize', cursor: 'pointer' }}>
                            {type}
                          </Tag>
                        </Checkbox>
                      ))}
                    </Checkbox.Group>
                  </div>

                  {/* Has Label */}
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      Has Label
                    </Text>
                    <Select
                      size="small"
                      value={filters.hasLabel}
                      onChange={val => setFilters(f => ({ ...f, hasLabel: val }))}
                      style={{ width: 120 }}
                      options={[
                        { label: 'Any', value: 'any' },
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' },
                      ]}
                    />
                  </div>

                  {/* Activity Labels */}
                  {availableActivityLabels.length > 0 && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        Activity Labels
                      </Text>
                      <Select
                        size="small"
                        mode="multiple"
                        allowClear
                        placeholder="All labels"
                        value={filters.activityLabels}
                        onChange={vals => setFilters(f => ({ ...f, activityLabels: vals }))}
                        style={{ width: '100%' }}
                        maxTagCount="responsive"
                        options={availableActivityLabels.map(l => ({ label: formatLabel(l), value: l }))}
                      />
                    </div>
                  )}

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

                  {/* Rows Processed Range */}
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

                  {/* Reset Button */}
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
      </div>
      <div style={{ height: 400 }}>
        <List
          rowCount={filteredNodes.length}
          rowHeight={44}
          rowComponent={Row}
          rowProps={rowProps}
          style={{ height: '100%' }}
        />
      </div>
    </Card>
  );
};

export default HierarchyExplorer;
