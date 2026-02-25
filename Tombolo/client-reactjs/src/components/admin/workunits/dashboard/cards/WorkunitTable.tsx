import { Table, Tag, Tooltip, Input, Select, Button } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useState, useMemo } from 'react';
import type { ColumnsType } from 'antd/es/table';

export interface CostBreakdown {
  compute: number;
  fileAccess: number;
  compile: number;
}

export interface WorkunitRecord {
  wuid: string;
  jobName?: string;
  cluster?: string;
  owner?: string;
  state?: string;
  cost: number;
  duration: number;
  cpuHours?: number;
  endTime?: string;
  costBreakdown: CostBreakdown;
  clusterId?: string;
  detailsFetchedAt?: string;
}

interface WorkunitTableProps {
  workunits: WorkunitRecord[];
}

const stateColors: Record<string, string> = {
  completed: 'green',
  failed: 'red',
  running: 'blue',
  blocked: 'orange',
  waiting: 'default',
};

export default function WorkunitTable({ workunits }: WorkunitTableProps) {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<string | undefined>(undefined);

  const filtered = useMemo(() => {
    let data = workunits;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        wu =>
          (wu.jobName || '').toLowerCase().includes(q) ||
          (wu.wuid || '').toLowerCase().includes(q) ||
          (wu.owner || '').toLowerCase().includes(q) ||
          (wu.cluster || '').toLowerCase().includes(q)
      );
    }
    if (stateFilter) {
      data = data.filter(wu => wu.state === stateFilter);
    }
    return data;
  }, [workunits, search, stateFilter]);

  const columns: ColumnsType<WorkunitRecord> = [
    {
      title: 'WUID',
      dataIndex: 'wuid',
      key: 'wuid',
      width: 180,
      render: (val: string) => (
        <span
          style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: 12,
            color: '#2563eb',
          }}>
          {val}
        </span>
      ),
    },
    {
      title: 'Job Name',
      dataIndex: 'jobName',
      key: 'jobName',
      ellipsis: true,
      render: (val: string) => (
        <Tooltip title={val}>
          <span style={{ color: '#374151', fontWeight: 500 }}>{val}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Cluster',
      dataIndex: 'cluster',
      key: 'cluster',
      width: 100,
      render: (val: string) => (
        <Tag
          style={{
            borderRadius: 4,
            textTransform: 'uppercase',
            fontSize: 10,
            letterSpacing: '0.5px',
          }}>
          {val}
        </Tag>
      ),
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      width: 120,
      render: (val: string) => <span style={{ color: '#6b7280', fontSize: 12 }}>{val}</span>,
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 100,
      render: (val: string) => (
        <Tag color={stateColors[val]} style={{ borderRadius: 4 }}>
          {val}
        </Tag>
      ),
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      sorter: (a, b) => a.cost - b.cost,
      defaultSortOrder: 'descend',
      render: (val: number) => (
        <span
          style={{
            fontFamily: 'var(--font-mono), monospace',
            color: val > 15 ? '#dc2626' : val > 8 ? '#d97706' : '#16a34a',
            fontWeight: 600,
          }}>
          ${val.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      sorter: (a, b) => a.duration - b.duration,
      render: (val: number) => {
        const h = Math.floor(val / 60);
        const m = Math.round(val % 60);
        return (
          <span style={{ color: '#6b7280', fontSize: 12 }}>
            {h > 0 ? `${h}h ` : ''}
            {m}m
          </span>
        );
      },
    },
    {
      title: 'Cost Breakdown',
      key: 'costBreakdown',
      width: 200,
      render: (_, record) => {
        const { compute, fileAccess, compile } = record.costBreakdown;
        const total = compute + fileAccess + compile;
        if (total === 0) return null;
        const cPct = (compute / total) * 100;
        const fPct = (fileAccess / total) * 100;
        return (
          <Tooltip
            title={
              <div>
                <div>Compute: ${compute.toFixed(2)}</div>
                <div>File Access: ${fileAccess.toFixed(2)}</div>
                <div>Compile: ${compile.toFixed(2)}</div>
              </div>
            }>
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: 8,
                borderRadius: 4,
                overflow: 'hidden',
                background: '#f3f4f6',
              }}>
              <div
                style={{
                  width: `${cPct}%`,
                  background: '#16a34a',
                  transition: 'width 0.3s',
                }}
              />
              <div
                style={{
                  width: `${fPct}%`,
                  background: '#2563eb',
                  transition: 'width 0.3s',
                }}
              />
              <div
                style={{
                  flex: 1,
                  background: '#d97706',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Details',
      key: 'details',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const hasDetails = record.clusterId && record.wuid && record.detailsFetchedAt;
        const detailsUrl = hasDetails ? `/workunits/history/${record.clusterId}/${record.wuid}` : null;

        return (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            disabled={!hasDetails}
            onClick={() => {
              if (detailsUrl) {
                window.open(detailsUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            style={{
              color: hasDetails ? '#2563eb' : '#9ca3af',
              padding: 0,
            }}>
            View
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}>
        <Input
          placeholder="Search jobs, WUIDs, owners..."
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
          allowClear
        />
        <Select
          placeholder="Filter by state"
          value={stateFilter}
          onChange={(val: string | undefined) => setStateFilter(val)}
          allowClear
          style={{ minWidth: 160 }}
          options={[
            { value: 'completed', label: 'Completed' },
            { value: 'failed', label: 'Failed' },
            { value: 'running', label: 'Running' },
            { value: 'blocked', label: 'Blocked' },
            { value: 'waiting', label: 'Waiting' },
          ]}
        />
      </div>
      <Table<WorkunitRecord>
        columns={columns}
        dataSource={filtered}
        rowKey={record => `${record.clusterId}:${record.wuid}`}
        size="small"
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 15,
          size: 'small',
          showSizeChanger: true,
          showTotal: total => <span style={{ color: '#6b7280', fontSize: 12 }}>{total} workunits</span>,
        }}
        style={{ borderRadius: 8, overflow: 'hidden' }}
      />
    </div>
  );
}
