import React, { useMemo, useState } from 'react';
import { Card, Collapse, InputNumber, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { FilterOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { formatCurrency, formatNumber, formatSeconds } from '@tombolo/shared';

const { Text } = Typography;

type FlatSortField = 'scopeName' | 'NumRowsProcessed' | 'CostExecute' | 'CostFileAccess' | 'TotalCost' | 'TimeElapsed';

interface FlatSortState {
  field: FlatSortField;
  order: 'ascend' | 'descend';
}

interface FlatFilters {
  minRows: number | null;
  maxRows: number | null;
  minExecuteCost: number | null;
  maxExecuteCost: number | null;
  minFileAccessCost: number | null;
  maxFileAccessCost: number | null;
  minTotalCost: number | null;
  maxTotalCost: number | null;
  minElapsed: number | null;
  maxElapsed: number | null;
}

const defaultFlatFilters: FlatFilters = {
  minRows: null,
  maxRows: null,
  minExecuteCost: null,
  maxExecuteCost: null,
  minFileAccessCost: null,
  maxFileAccessCost: null,
  minTotalCost: null,
  maxTotalCost: null,
  minElapsed: null,
  maxElapsed: null,
};

const toNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatCompactRows = (value: number): string => {
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(3).replace(/\.?0+$/, '')}T`;
  }
  if (absValue >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(3).replace(/\.?0+$/, '')}B`;
  }
  if (absValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(3).replace(/\.?0+$/, '')}M`;
  }
  if (absValue >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.?0+$/, '')}K`;
  }
  return formatNumber(value);
};

const getTotalScopeCost = (scope: any): number => toNumber(scope.CostExecute) + toNumber(scope.CostFileAccess);

const flatSortLabels: Record<FlatSortField, string> = {
  scopeName: 'Scope',
  NumRowsProcessed: 'Row Counts',
  CostExecute: 'Execute Cost',
  CostFileAccess: 'File Access Cost',
  TotalCost: 'Total Cost',
  TimeElapsed: 'Time Elapsed',
};

interface Props {
  items: any[];
  selectedKey?: any;
  onSelectKey: (key: any) => void;
}

const FlatScopesPanel: React.FC<Props> = ({ items, selectedKey, onSelectKey }) => {
  const [flatSort, setFlatSort] = useState<FlatSortState>({ field: 'TimeElapsed', order: 'descend' });
  const [flatFilters, setFlatFilters] = useState<FlatFilters>(defaultFlatFilters);
  const [flatFiltersExpanded, setFlatFiltersExpanded] = useState(false);

  const filteredFlatScopes = useMemo(() => {
    return items.filter(n => {
      const rows = Number(n.NumRowsProcessed || 0);
      if (flatFilters.minRows !== null && rows < flatFilters.minRows) return false;
      if (flatFilters.maxRows !== null && rows > flatFilters.maxRows) return false;

      const executeCost = toNumber(n.CostExecute);
      if (flatFilters.minExecuteCost !== null && executeCost < flatFilters.minExecuteCost) return false;
      if (flatFilters.maxExecuteCost !== null && executeCost > flatFilters.maxExecuteCost) return false;

      const fileAccessCost = toNumber(n.CostFileAccess);
      if (flatFilters.minFileAccessCost !== null && fileAccessCost < flatFilters.minFileAccessCost) return false;
      if (flatFilters.maxFileAccessCost !== null && fileAccessCost > flatFilters.maxFileAccessCost) return false;

      const totalCost = getTotalScopeCost(n);
      if (flatFilters.minTotalCost !== null && totalCost < flatFilters.minTotalCost) return false;
      if (flatFilters.maxTotalCost !== null && totalCost > flatFilters.maxTotalCost) return false;

      const elapsed = Number(n.TimeElapsed || 0);
      if (flatFilters.minElapsed !== null && elapsed < flatFilters.minElapsed) return false;
      if (flatFilters.maxElapsed !== null && elapsed > flatFilters.maxElapsed) return false;

      return true;
    });
  }, [items, flatFilters]);

  const sortedFlatScopes = useMemo(() => {
    const sorted = [...filteredFlatScopes];
    const direction = flatSort.order === 'ascend' ? 1 : -1;

    sorted.sort((a, b) => {
      if (flatSort.field === 'scopeName') {
        const leftName = a.scopeName || a.key || '';
        const rightName = b.scopeName || b.key || '';
        const byName = leftName.localeCompare(rightName, undefined, { numeric: true });
        if (byName !== 0) return byName * direction;
        return String(a.key || '').localeCompare(String(b.key || ''), undefined, { numeric: true }) * direction;
      }

      const left = flatSort.field === 'TotalCost' ? getTotalScopeCost(a) : toNumber(a[flatSort.field]);
      const right = flatSort.field === 'TotalCost' ? getTotalScopeCost(b) : toNumber(b[flatSort.field]);

      if (left === right) {
        return (a.scopeName || a.key || '').localeCompare(b.scopeName || b.key || '', undefined, { numeric: true });
      }

      return (left - right) * direction;
    });

    return sorted;
  }, [filteredFlatScopes, flatSort]);

  const flatRows = useMemo(
    () => sortedFlatScopes.map(({ children: _children, ...rest }: any) => rest),
    [sortedFlatScopes]
  );

  const flatColumns = useMemo(
    () => [
      {
        title: 'Scope',
        dataIndex: 'scopeName',
        key: 'scopeName',
        render: (v: any, r: any) => <span>{v || r.key}</span>,
      },
      {
        title: 'Rows Processed',
        dataIndex: 'NumRowsProcessed',
        key: 'NumRowsProcessed',
        align: 'right' as const,
        width: 110,
        render: (v: any) => {
          const numericRows = toNumber(v);
          return (
            <Tooltip title={formatNumber(numericRows)} placement="top">
              <span>{formatCompactRows(numericRows)}</span>
            </Tooltip>
          );
        },
      },
      {
        title: 'Execute Cost',
        dataIndex: 'CostExecute',
        key: 'CostExecute',
        align: 'right' as const,
        width: 120,
        render: (v: any) => <span>{formatCurrency(v)}</span>,
      },
      {
        title: 'File Access Cost',
        dataIndex: 'CostFileAccess',
        key: 'CostFileAccess',
        align: 'right' as const,
        width: 130,
        render: (v: any) => <span>{formatCurrency(v)}</span>,
      },
      {
        title: 'Total Cost',
        key: 'TotalCost',
        align: 'right' as const,
        width: 120,
        render: (_v: any, r: any) => <span>{formatCurrency(getTotalScopeCost(r))}</span>,
      },
      {
        title: 'Time Elapsed',
        dataIndex: 'TimeElapsed',
        key: 'TimeElapsed',
        align: 'right' as const,
        width: 110,
        render: (v: any) => <span>{formatSeconds(v)}</span>,
      },
    ],
    []
  );

  return (
    <Card
      title={
        <Space>
          <UnorderedListOutlined />
          <span>Flat Scopes</span>
        </Space>
      }
      styles={{ body: { padding: 12 } }}>
      <div style={{ marginBottom: 8 }}>
        <Collapse
          ghost
          size="small"
          activeKey={flatFiltersExpanded ? ['filters'] : []}
          onChange={keys => setFlatFiltersExpanded(keys.includes('filters'))}
          items={[
            {
              key: 'filters',
              label: (
                <Space size={4}>
                  <FilterOutlined style={{ fontSize: 12 }} />
                  <span style={{ fontSize: 13 }}>Filters</span>
                  {(flatFilters.minRows !== null ||
                    flatFilters.maxRows !== null ||
                    flatFilters.minExecuteCost !== null ||
                    flatFilters.maxExecuteCost !== null ||
                    flatFilters.minFileAccessCost !== null ||
                    flatFilters.maxFileAccessCost !== null ||
                    flatFilters.minTotalCost !== null ||
                    flatFilters.maxTotalCost !== null ||
                    flatFilters.minElapsed !== null ||
                    flatFilters.maxElapsed !== null) && (
                    <Tag color="blue" style={{ marginLeft: 4, fontSize: 11 }}>
                      Active
                    </Tag>
                  )}
                </Space>
              ),
              children: (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 12,
                    paddingBottom: 8,
                    alignItems: 'end',
                  }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      Rows Processed
                    </Text>
                    <Space size={8}>
                      <InputNumber
                        size="small"
                        placeholder="Min"
                        min={0}
                        value={flatFilters.minRows}
                        onChange={val => setFlatFilters(f => ({ ...f, minRows: val }))}
                        style={{ width: 110 }}
                      />
                      <Text type="secondary">to</Text>
                      <InputNumber
                        size="small"
                        placeholder="Max"
                        min={0}
                        value={flatFilters.maxRows}
                        onChange={val => setFlatFilters(f => ({ ...f, maxRows: val }))}
                        style={{ width: 110 }}
                      />
                    </Space>
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      Execute Cost
                    </Text>
                    <Space size={8}>
                      <InputNumber
                        size="small"
                        placeholder="Min"
                        min={0}
                        value={flatFilters.minExecuteCost}
                        onChange={val => setFlatFilters(f => ({ ...f, minExecuteCost: val }))}
                        style={{ width: 110 }}
                      />
                      <Text type="secondary">to</Text>
                      <InputNumber
                        size="small"
                        placeholder="Max"
                        min={0}
                        value={flatFilters.maxExecuteCost}
                        onChange={val => setFlatFilters(f => ({ ...f, maxExecuteCost: val }))}
                        style={{ width: 110 }}
                      />
                    </Space>
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      File Access Cost
                    </Text>
                    <Space size={8}>
                      <InputNumber
                        size="small"
                        placeholder="Min"
                        min={0}
                        value={flatFilters.minFileAccessCost}
                        onChange={val => setFlatFilters(f => ({ ...f, minFileAccessCost: val }))}
                        style={{ width: 110 }}
                      />
                      <Text type="secondary">to</Text>
                      <InputNumber
                        size="small"
                        placeholder="Max"
                        min={0}
                        value={flatFilters.maxFileAccessCost}
                        onChange={val => setFlatFilters(f => ({ ...f, maxFileAccessCost: val }))}
                        style={{ width: 110 }}
                      />
                    </Space>
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      Total Cost
                    </Text>
                    <Space size={8}>
                      <InputNumber
                        size="small"
                        placeholder="Min"
                        min={0}
                        value={flatFilters.minTotalCost}
                        onChange={val => setFlatFilters(f => ({ ...f, minTotalCost: val }))}
                        style={{ width: 110 }}
                      />
                      <Text type="secondary">to</Text>
                      <InputNumber
                        size="small"
                        placeholder="Max"
                        min={0}
                        value={flatFilters.maxTotalCost}
                        onChange={val => setFlatFilters(f => ({ ...f, maxTotalCost: val }))}
                        style={{ width: 110 }}
                      />
                    </Space>
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      Elapsed Time (seconds)
                    </Text>
                    <Space size={8}>
                      <InputNumber
                        size="small"
                        placeholder="Min"
                        min={0}
                        value={flatFilters.minElapsed}
                        onChange={val => setFlatFilters(f => ({ ...f, minElapsed: val }))}
                        style={{ width: 110 }}
                      />
                      <Text type="secondary">to</Text>
                      <InputNumber
                        size="small"
                        placeholder="Max"
                        min={0}
                        value={flatFilters.maxElapsed}
                        onChange={val => setFlatFilters(f => ({ ...f, maxElapsed: val }))}
                        style={{ width: 110 }}
                      />
                    </Space>
                  </div>

                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                    <Tag style={{ cursor: 'pointer' }} onClick={() => setFlatFilters(defaultFlatFilters)}>
                      Reset Filters
                    </Tag>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
      <Space style={{ marginBottom: 8, width: '100%', justifyContent: 'space-between' }}>
        <Space size={4}>
          <Text type="secondary">Sorted By</Text>
          <Tag color="blue">{flatSortLabels[flatSort.field]}</Tag>
          <Tag>{flatSort.order === 'ascend' ? 'Ascending' : 'Descending'}</Tag>
        </Space>
        <Tag>{flatRows.length} items</Tag>
      </Space>
      <Table
        size="small"
        rowKey={(r: any) => r.key}
        dataSource={flatRows}
        columns={flatColumns.map((col: any) => ({
          ...col,
          sorter: [
            'scopeName',
            'NumRowsProcessed',
            'CostExecute',
            'CostFileAccess',
            'TotalCost',
            'TimeElapsed',
          ].includes(col.key),
          sortOrder: col.key === flatSort.field ? flatSort.order : null,
          sortDirections: ['ascend', 'descend', 'ascend'],
        }))}
        pagination={false}
        scroll={{ y: 460 }}
        virtual
        expandable={{ showExpandColumn: false }}
        onChange={(_pagination, _filters, sorter) => {
          const sorterInfo = Array.isArray(sorter) ? sorter[0] : sorter;
          const key = sorterInfo?.columnKey as FlatSortField | undefined;
          const order = sorterInfo?.order;
          if (
            key &&
            ['scopeName', 'NumRowsProcessed', 'CostExecute', 'CostFileAccess', 'TotalCost', 'TimeElapsed'].includes(
              key
            ) &&
            (order === 'ascend' || order === 'descend')
          ) {
            setFlatSort({ field: key, order });
          }
        }}
        onRow={record => ({
          onClick: () => onSelectKey(record.key),
          style: {
            cursor: 'pointer',
            backgroundColor: selectedKey === record.key ? '#e6f4ff' : undefined,
          },
        })}
      />
    </Card>
  );
};

export default FlatScopesPanel;
