import { Table, Tag, Tooltip, Input, Select, Button } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { formatCurrency } from '@tombolo/shared';
import { useState, useEffect, useCallback } from 'react';
import type { ColumnsType } from 'antd/es/table';
import workunitsService from '@/services/workunits.service';
import clustersService from '@/services/clusters.service';

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
  clusterId: string;
  detailsFetchedAt?: string;
}

interface WorkunitTableProps {
  startDate: string;
  endDate: string;
  clusterId?: string;
}

const stateColors: Record<string, string> = {
  completed: 'green',
  failed: 'red',
  running: 'blue',
  blocked: 'orange',
  waiting: 'default',
};

export default function WorkunitTable({ startDate, endDate, clusterId }: WorkunitTableProps) {
  const [data, setData] = useState<WorkunitRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [sortField, setSortField] = useState('totalCost');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [clusterMap, setClusterMap] = useState<Record<string, string>>({});

  // Controlled text inputs
  const [jobNameInput, setJobNameInput] = useState('');
  const [ownerInput, setOwnerInput] = useState('');
  const [stateFilter, setStateFilter] = useState<string | undefined>(undefined);

  // Debounced values used in API calls
  const [debouncedJobName, setDebouncedJobName] = useState('');
  const [debouncedOwner, setDebouncedOwner] = useState('');

  // Debounce text inputs by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedJobName(jobNameInput);
      setDebouncedOwner(ownerInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [jobNameInput, ownerInput]);

  // Fetch cluster names once for display
  useEffect(() => {
    clustersService
      .getAll()
      .then((clusters: any[]) => {
        const map: Record<string, string> = {};
        (clusters || []).forEach((c: any) => {
          map[c.id] = c.name;
        });
        setClusterMap(map);
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit,
        sort: sortField,
        order: sortOrder,
        dateFrom: startDate,
        dateTo: endDate,
      };
      if (clusterId) params.clusterId = clusterId;
      if (debouncedJobName) params.jobName = debouncedJobName;
      if (debouncedOwner) params.owner = debouncedOwner;
      if (stateFilter) params.state = stateFilter;

      const result = await workunitsService.getAll(params);
      const rows: WorkunitRecord[] = (result.data || []).map((wu: any) => ({
        wuid: wu.wuId,
        jobName: wu.jobName,
        clusterId: wu.clusterId,
        cluster: wu.clusterId, // resolved to name in render via clusterMap
        owner: wu.owner,
        state: wu.state,
        cost: wu.totalCost ?? 0,
        cpuHours: wu.totalClusterTime ?? 0,
        duration: (wu.totalClusterTime ?? 0) * 60, // hours → minutes
        endTime: wu.endTimestamp ?? undefined,
        detailsFetchedAt: wu.detailsFetchedAt ?? undefined,
        costBreakdown: {
          compute: wu.executeCost ?? 0,
          fileAccess: wu.fileAccessCost ?? 0,
          compile: wu.compileCost ?? 0,
        },
      }));
      setData(rows);
      setTotal(result.total || 0);
    } catch (err) {
      console.error('WorkunitTable fetch error:', err);
    } finally {
      setLoading(false);
    }
    // clusterMap intentionally omitted — names are resolved in render only
  }, [page, limit, sortField, sortOrder, startDate, endDate, clusterId, debouncedJobName, debouncedOwner, stateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Map from column dataIndex → backend sort field name where they differ
  const sortFieldMap: Record<string, string> = {
    cost: 'totalCost',
    duration: 'totalClusterTime',
    endTime: 'endTimestamp',
  };

  // Reverse map: backend field → column dataIndex (for controlled sortOrder)
  const backendToColumnMap: Record<string, string> = {
    totalCost: 'cost',
    totalClusterTime: 'duration',
    endTimestamp: 'endTime',
  };

  // The column dataIndex that is currently active, used to set controlled sortOrder
  const activeSortColumn = backendToColumnMap[sortField] ?? sortField;

  const handleTableChange = (pagination: any, _filters: any, sorter: any, extra: any) => {
    if (extra?.action === 'sort') {
      const s = Array.isArray(sorter) ? sorter[0] : sorter;
      if (s?.field && s?.order) {
        const backendField = sortFieldMap[String(s.field)] ?? String(s.field);
        setSortField(backendField);
        setSortOrder(s.order === 'ascend' ? 'asc' : 'desc');
        setPage(1);
        setLimit(pagination.pageSize ?? 15);
      } else {
        // Sort cleared — reset to default so UI and API stay in sync
        setSortField('totalCost');
        setSortOrder('desc');
        setPage(1);
      }
    } else {
      // 'paginate' or 'filter' — never touch sort state
      setPage(pagination.current ?? 1);
      setLimit(pagination.pageSize ?? 15);
    }
  };

  const handleStateFilterChange = (val: string | undefined) => {
    setStateFilter(val);
    setPage(1);
  };

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
      render: (val: string) =>
        val ? (
          <Tooltip title={val}>
            <span style={{ color: '#374151', fontWeight: 500 }}>{val}</span>
          </Tooltip>
        ) : (
          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>&lt;Unnamed&gt;</span>
        ),
    },
    {
      title: 'Cluster',
      dataIndex: 'clusterId',
      key: 'cluster',
      width: 100,
      render: (clusterId: string) => (
        <Tag
          style={{
            borderRadius: 4,
            textTransform: 'uppercase',
            fontSize: 10,
            letterSpacing: '0.5px',
          }}>
          {clusterMap[clusterId] || clusterId}
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
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'] as const,
      sortOrder: activeSortColumn === 'cost' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
      render: (val: number) => (
        <span
          style={{
            fontFamily: 'var(--font-mono), monospace',
            color: val > 15 ? '#dc2626' : val > 8 ? '#d97706' : '#16a34a',
            fontWeight: 600,
          }}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'] as const,
      sortOrder: activeSortColumn === 'duration' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
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
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'] as const,
      sortOrder: activeSortColumn === 'endTime' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
      render: (val: string | null) =>
        val ? (
          <span style={{ color: '#6b7280', fontSize: 12 }}>{new Date(val).toLocaleString()}</span>
        ) : (
          <span style={{ color: '#9ca3af' }}>—</span>
        ),
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
                <div>Compute: {formatCurrency(compute)}</div>
                <div>File Access: {formatCurrency(fileAccess)}</div>
                <div>Compile: {formatCurrency(compile)}</div>
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
          placeholder="Search by job name..."
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          value={jobNameInput}
          onChange={e => setJobNameInput(e.target.value)}
          style={{ maxWidth: 240 }}
          allowClear
        />
        <Input
          placeholder="Search by owner..."
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          value={ownerInput}
          onChange={e => setOwnerInput(e.target.value)}
          style={{ maxWidth: 200 }}
          allowClear
        />
        <Select
          placeholder="Filter by state"
          value={stateFilter}
          onChange={handleStateFilterChange}
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
        dataSource={data}
        loading={loading}
        rowKey={record => `${record.clusterId}:${record.wuid}`}
        size="small"
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          size: 'small',
          showSizeChanger: true,
          showTotal: t => <span style={{ color: '#6b7280', fontSize: 12 }}>{t} workunits</span>,
        }}
        onChange={handleTableChange}
        style={{ borderRadius: 8, overflow: 'hidden' }}
      />
    </div>
  );
}
