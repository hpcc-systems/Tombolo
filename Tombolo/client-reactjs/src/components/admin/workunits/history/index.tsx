import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Table,
  Card,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Typography,
  message,
  Tooltip,
  Row,
  Col,
  Statistic,
  Segmented,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import workunitsService from '@/services/workunits.service';
import { formatCurrency, formatHours } from '@tombolo/shared';
import clustersService from '@/services/clusters.service';
import { loadLocalStorage, saveLocalStorage } from '@tombolo/shared/browser';
import { groupWorkunitsByName } from '@/components/admin/workunits/history/common/fuzzyMatch';
import styles from './workunitHistory.module.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const WorkUnitHistory: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(() => loadLocalStorage('wuh.list.page', 1));
  const [limit, setLimit] = useState<number>(() => loadLocalStorage('wuh.list.limit', 50));
  const [sortField, setSortField] = useState<string>(() => loadLocalStorage('wuh.list.sortField', 'workUnitTimestamp'));
  const [sortOrder, setSortOrder] = useState<string>(() => loadLocalStorage('wuh.list.sortOrder', 'desc'));
  const [clusters, setClusters] = useState<any[]>([]);
  const [clusterMap, setClusterMap] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>('1');
  const [groupedData, setGroupedData] = useState<any[]>([]);

  // Filters
  const [filters, setFilters] = useState<any>(() => {
    const saved = loadLocalStorage('wuh.list.filters', {}) as any;
    if (saved.dateRange) {
      saved.dateRange = saved.dateRange.map((d: any) => (d ? dayjs(d) : null));
    }
    return {
      clusterId: undefined,
      state: undefined,
      owner: undefined,
      jobName: undefined,
      dateRange: undefined,
      costAbove: undefined,
      detailsFetched: undefined,
      ...saved,
    };
  });

  useEffect(() => saveLocalStorage('wuh.list.page', page), [page]);
  useEffect(() => saveLocalStorage('wuh.list.limit', limit), [limit]);
  useEffect(() => saveLocalStorage('wuh.list.sortField', sortField), [sortField]);
  useEffect(() => saveLocalStorage('wuh.list.sortOrder', sortOrder), [sortOrder]);
  useEffect(() => saveLocalStorage('wuh.list.filters', filters), [filters]);

  const [statistics, setStatistics] = useState({
    totalJobs: 0,
    totalCost: 0,
    avgTime: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams: any = {
        page,
        limit,
        sort: sortField,
        order: sortOrder,
      };

      // Apply filters
      if (filters.clusterId) queryParams.clusterId = filters.clusterId;
      if (filters.state) queryParams.state = filters.state;
      if (filters.owner) queryParams.owner = filters.owner;
      if (filters.jobName) queryParams.jobName = filters.jobName;
      if (filters.dateRange && filters.dateRange[0]) {
        queryParams.dateFrom = filters.dateRange[0].toISOString();
        queryParams.dateTo = filters.dateRange[1].toISOString();
      }
      if (filters.costAbove) queryParams.costAbove = filters.costAbove;
      if (filters.detailsFetched !== undefined) queryParams.detailsFetched = filters.detailsFetched;

      const result = await workunitsService.getAll(queryParams);
      setData(result.data || []);
      setTotal(result.total || 0);

      // Use backend-calculated aggregates (computed over all matching rows, not just the current page)
      setStatistics({
        totalJobs: result.total || 0,
        totalCost: result.totalCost ?? 0,
        // avgClusterTime is in hours from the backend; convert to seconds for display
        avgTime: (result.avgClusterTime ?? 0) * 3600,
      });
    } catch (_error) {
      message.error('Failed to load workunit history');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    sortField,
    sortOrder,
    filters.clusterId,
    filters.state,
    filters.owner,
    filters.jobName,
    filters.dateRange,
    filters.costAbove,
    filters.detailsFetched,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch clusters on mount
  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const clusterData = await clustersService.getAll();
        setClusters(clusterData || []);

        const map: Record<string, string> = {};
        (clusterData || []).forEach((cluster: any) => {
          map[cluster.id] = cluster.name;
        });
        setClusterMap(map);
      } catch (error) {
        console.error('Error fetching clusters:', error);
      }
    };

    fetchClusters();
  }, []);

  const handleTableChange = (newPagination: any, _filters: any, sorter: any, extra: any) => {
    if (extra?.action === 'sort') {
      const s = Array.isArray(sorter) ? sorter[0] : sorter;
      if (s?.field && s?.order) {
        setSortField(s.field);
        setSortOrder(s.order === 'ascend' ? 'asc' : 'desc');
        setPage(1);
        setLimit(newPagination.pageSize ?? limit);
      }
      // If sort was cleared (s.order falsy), do nothing — keep current sort state
    } else {
      // Only pagination changed
      setPage(newPagination.current);
      setLimit(newPagination.pageSize);
    }
  };

  const handleSearch = () => {
    setPage(1);
    if (page === 1) {
      fetchData();
    }
  };

  const handleReset = () => {
    const defaultFilters = {
      clusterId: undefined,
      state: undefined,
      owner: undefined,
      jobName: undefined,
      dateRange: undefined,
      costAbove: undefined,
      detailsFetched: undefined,
    };
    setFilters(defaultFilters);
    setPage(1);
    setSortField('workUnitTimestamp');
    setSortOrder('desc');
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === '2' && data.length > 0) {
      const groupedDataResult = groupWorkunitsByName(data, 0.8);

      // Convert to array format for table display
      const groupsArray = Object.entries(groupedDataResult)
        .map(([groupName, workunits]) => {
          // Sort by timestamp to get the latest job
          const sortedWorkunits = (workunits as any[]).sort(
            (a, b) => new Date(b.workUnitTimestamp || 0).getTime() - new Date(a.workUnitTimestamp || 0).getTime()
          );
          const latestJob = sortedWorkunits[0];

          return {
            key: groupName, // Required by antd Table
            groupName,
            latestJob,
            workunits: sortedWorkunits,
            count: workunits.length,
            // Properties from latest job for display
            jobName: latestJob.jobName,
            wuId: latestJob.wuId,
            clusterId: latestJob.clusterId,
            owner: latestJob.owner,
            state: latestJob.state,
            totalCost: latestJob.totalCost,
            totalClusterTime: latestJob.totalClusterTime,
            workUnitTimestamp: latestJob.workUnitTimestamp,
            detailsFetchedAt: latestJob.detailsFetchedAt,
          };
        })
        .sort((a, b) => b.count - a.count); // Sort by count descending

      setGroupedData(groupsArray);
    }
  };

  const handleView = (record: any) => {
    history.push(`/workunits/history/${record.clusterId}/${record.wuId}`);
  };

  const getSortOrder = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? ('ascend' as const) : ('descend' as const);
  };

  const stateColors: Record<string, string> = {
    completed: 'green',
    failed: 'red',
    running: 'blue',
    blocked: 'orange',
    waiting: 'default',
    aborted: 'orange',
  };

  const columns = [
    {
      title: 'WUID',
      dataIndex: 'wuId',
      key: 'wuId',
      width: 135,
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
      width: 200,
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
      key: 'clusterId',
      width: 120,
      ellipsis: true,
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
      width: 100,
      ellipsis: true,
      render: (val: string) => <span style={{ color: '#6b7280', fontSize: 12 }}>{val}</span>,
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 90,
      render: (val: string) => (
        <Tag color={stateColors[val]} style={{ borderRadius: 4 }}>
          {val ? val.toUpperCase() : 'UNKNOWN'}
        </Tag>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'totalClusterTime',
      key: 'totalClusterTime',
      width: 100,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'] as ('ascend' | 'descend')[],
      sortOrder: getSortOrder('totalClusterTime'),
      render: (val: any) => {
        if (val == null) return <span style={{ color: '#9ca3af' }}>—</span>;
        const h = Math.floor(val);
        const m = Math.round((val - h) * 60);
        return (
          <span style={{ color: '#6b7280', fontSize: 12 }}>
            {h > 0 ? `${h}h ` : ''}
            {m}m
          </span>
        );
      },
    },
    {
      title: 'Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 100,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'] as ('ascend' | 'descend')[],
      sortOrder: getSortOrder('totalCost'),
      render: (val: any) => (
        <span
          style={{
            fontFamily: 'var(--font-mono), monospace',
            color: val > 15 ? '#dc2626' : val > 8 ? '#d97706' : '#16a34a',
            fontWeight: 600,
          }}>
          {val != null ? formatCurrency(val) : '-'}
        </span>
      ),
    },
    {
      title: 'Cost Breakdown',
      key: 'costBreakdown',
      width: 200,
      render: (_: any, record: any) => {
        const compute = record.executeCost ?? 0;
        const fileAccess = record.fileAccessCost ?? 0;
        const compile = record.compileCost ?? 0;
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
              <div style={{ width: `${cPct}%`, background: '#16a34a', transition: 'width 0.3s' }} />
              <div style={{ width: `${fPct}%`, background: '#2563eb', transition: 'width 0.3s' }} />
              <div style={{ flex: 1, background: '#d97706', transition: 'width 0.3s' }} />
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Details',
      key: 'details',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: any) => {
        const hasDetails = record.clusterId && record.wuId && record.detailsFetchedAt;
        return (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            disabled={!hasDetails}
            onClick={() => {
              if (hasDetails) handleView(record);
            }}
            style={{ color: hasDetails ? '#2563eb' : '#9ca3af', padding: 0 }}>
            View
          </Button>
        );
      },
    },
  ];

  // Columns for grouped table (showing latest job from each group)
  const groupedColumns = [
    {
      title: 'Job Name Group',
      dataIndex: 'jobName',
      key: 'groupName',
      ellipsis: true,
      render: (text: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Space size={4} align="center">
            <Text strong className={styles.ellipsis}>
              {text || record.latestJob.wuId}
            </Text>
            <Tag color="blue">{record.count} jobs</Tag>
          </Space>
          <Text type="secondary" className={`${styles.smallText} ${styles.ellipsis}`}>
            Latest: {record.latestJob.wuId}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Cluster',
      dataIndex: 'clusterId',
      key: 'clusterId',
      width: 80,
      ellipsis: true,
      render: (clusterId: string) => clusterMap[clusterId] || clusterId,
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      width: 80,
      ellipsis: true,
    },
  ];

  // Columns for nested table (matches list view styling, no backend sorting)
  const nestedColumns = [
    {
      title: 'WUID',
      dataIndex: 'wuId',
      key: 'wuId',
      width: 140,
      render: (val: string) => (
        <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: '#2563eb' }}>{val}</span>
      ),
    },
    {
      title: 'Job Name',
      dataIndex: 'jobName',
      key: 'jobName',
      width: 200,
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
      key: 'clusterId',
      width: 120,
      ellipsis: true,
      render: (clusterId: string) => (
        <Tag style={{ borderRadius: 4, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px' }}>
          {clusterMap[clusterId] || clusterId}
        </Tag>
      ),
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      width: 100,
      ellipsis: true,
      render: (val: string) => <span style={{ color: '#6b7280', fontSize: 12 }}>{val}</span>,
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 90,
      render: (val: string) => (
        <Tag color={stateColors[val]} style={{ borderRadius: 4 }}>
          {val ? val.toUpperCase() : 'UNKNOWN'}
        </Tag>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'totalClusterTime',
      key: 'totalClusterTime',
      width: 100,
      render: (val: any) => {
        if (val == null) return <span style={{ color: '#9ca3af' }}>—</span>;
        const h = Math.floor(val);
        const m = Math.round((val - h) * 60);
        return (
          <span style={{ color: '#6b7280', fontSize: 12 }}>
            {h > 0 ? `${h}h ` : ''}
            {m}m
          </span>
        );
      },
    },
    {
      title: 'Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 100,
      render: (val: any) => (
        <span
          style={{
            fontFamily: 'var(--font-mono), monospace',
            color: val > 15 ? '#dc2626' : val > 8 ? '#d97706' : '#16a34a',
            fontWeight: 600,
          }}>
          {val != null ? formatCurrency(val) : '-'}
        </span>
      ),
    },
    {
      title: 'Cost Breakdown',
      key: 'costBreakdown',
      width: 200,
      render: (_: any, record: any) => {
        const compute = record.executeCost ?? 0;
        const fileAccess = record.fileAccessCost ?? 0;
        const compile = record.compileCost ?? 0;
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
              <div style={{ width: `${cPct}%`, background: '#16a34a', transition: 'width 0.3s' }} />
              <div style={{ width: `${fPct}%`, background: '#2563eb', transition: 'width 0.3s' }} />
              <div style={{ flex: 1, background: '#d97706', transition: 'width 0.3s' }} />
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Details',
      key: 'details',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: any) => {
        const hasDetails = record.clusterId && record.wuId && record.detailsFetchedAt;
        return (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            disabled={!hasDetails}
            onClick={() => {
              if (hasDetails) handleView(record);
            }}
            style={{ color: hasDetails ? '#2563eb' : '#9ca3af', padding: 0 }}>
            View
          </Button>
        );
      },
    },
  ];

  return (
    <div className={`${styles.pageContainer} ${styles.pageBgLight}`}>
      <Title level={2}>Workunit History</Title>

      <Card size="small" className={styles.mb16}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title={
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Total Workunits
                </Text>
              }
              value={statistics.totalJobs}
              prefix={<ClockCircleOutlined style={{ fontSize: '14px' }} />}
              valueStyle={{ fontSize: '20px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Total Cost
                </Text>
              }
              value={statistics.totalCost}
              precision={2}
              prefix={<DollarOutlined style={{ fontSize: '14px' }} />}
              suffix={
                <Text type="secondary" style={{ fontSize: '12px', marginLeft: '4px' }}>
                  USD
                </Text>
              }
              valueStyle={{ fontSize: '20px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Avg Time
                </Text>
              }
              value={formatHours((statistics.avgTime || 0) / 3600)}
              prefix={<ClockCircleOutlined style={{ fontSize: '14px' }} />}
              valueStyle={{ fontSize: '20px' }}
            />
          </Col>
        </Row>
      </Card>

      <Card className={styles.cardMarginBottom16}>
        <Space direction="vertical" size="middle" className={styles.fullWidth}>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Input
                placeholder="Job Name"
                value={filters.jobName}
                onChange={e => setFilters({ ...filters, jobName: e.target.value })}
                allowClear
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="Select Cluster"
                value={filters.clusterId}
                onChange={value => setFilters({ ...filters, clusterId: value })}
                className={styles.fullWidth}
                allowClear
                showSearch
                filterOption={(input, option: any) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}>
                {clusters.map(cluster => (
                  <Option key={cluster.id} value={cluster.id}>
                    {cluster.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Select
                placeholder="State"
                value={filters.state}
                onChange={value => setFilters({ ...filters, state: value })}
                className={styles.fullWidth}
                allowClear>
                <Option value="completed">Completed</Option>
                <Option value="failed">Failed</Option>
                <Option value="running">Running</Option>
                <Option value="aborted">Aborted</Option>
              </Select>
            </Col>
            <Col span={6}>
              <Input
                placeholder="Owner"
                value={filters.owner}
                onChange={e => setFilters({ ...filters, owner: e.target.value })}
                allowClear
              />
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <RangePicker
                value={filters.dateRange}
                onChange={dates => setFilters({ ...filters, dateRange: dates })}
                className={styles.fullWidth}
                showTime
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Details fetched"
                value={filters.detailsFetched}
                onChange={value => setFilters({ ...filters, detailsFetched: value })}
                className={styles.fullWidth}
                allowClear>
                <Option value={true}>Yes</Option>
                <Option value={false}>No</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Input
                placeholder="Min Cost ($)"
                type="number"
                value={filters.costAbove}
                onChange={e => setFilters({ ...filters, costAbove: e.target.value })}
                allowClear
              />
            </Col>
            <Col span={8}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  Search
                </Button>
                <Button icon={<FilterOutlined />} onClick={handleReset}>
                  Reset
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
                  Refresh
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card
        title="Workunits"
        styles={{ body: { padding: 0, overflow: 'hidden' } }}
        extra={
          <Space align="center">
            {activeTab === '1' && (
              <Space size={12}>
                <Space size={4} align="center">
                  <span
                    style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#16a34a' }}
                  />
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Compute</span>
                </Space>
                <Space size={4} align="center">
                  <span
                    style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#2563eb' }}
                  />
                  <span style={{ fontSize: 11, color: '#6b7280' }}>File Access</span>
                </Space>
                <Space size={4} align="center">
                  <span
                    style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#d97706' }}
                  />
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Compile</span>
                </Space>
              </Space>
            )}
            <Segmented
              value={activeTab}
              onChange={handleTabChange}
              options={[
                { label: 'List View', value: '1' },
                { label: 'Grouped', value: '2' },
              ]}
            />
          </Space>
        }>
        {activeTab === '1' ? (
          <Table
            columns={columns}
            dataSource={data}
            rowKey={record => `${record.clusterId}:${record.wuId}`}
            loading={loading}
            size="small"
            pagination={{
              current: page,
              pageSize: limit,
              total: total,
              size: 'small',
              showSizeChanger: true,
              showTotal: (total: number) => <span style={{ color: '#6b7280', fontSize: 12 }}>{total} workunits</span>,
              pageSizeOptions: ['25', '50', '100', '200'],
            }}
            onChange={handleTableChange}
            rowClassName={record => {
              if (record.state === 'failed' || record.state === 'aborted') {
                return 'wu-row-failed';
              }
              // Orange for long running (>2h) - totalClusterTime is in hours
              if (record.state === 'running' && (record.totalClusterTime || 0) > 2) {
                return 'wu-row-long-running';
              }
              return '';
            }}
            onRow={record => ({
              onClick: () => {
                if (record.clusterId && record.wuId && record.detailsFetchedAt) handleView(record);
              },
              style: { cursor: record.detailsFetchedAt ? 'pointer' : 'default' },
            })}
            style={{ borderRadius: 0, overflow: 'hidden' }}
            scroll={{ x: 1100 }}
          />
        ) : (
          <Table
            columns={groupedColumns}
            dataSource={groupedData}
            rowKey="key"
            loading={loading}
            size="small"
            expandable={{
              expandRowByClick: true,
              expandedRowRender: record => (
                <div>
                  <Table
                    columns={nestedColumns}
                    dataSource={record.workunits}
                    rowKey="wuId"
                    pagination={false}
                    size="small"
                    bordered
                    className="nested-table"
                    components={{
                      header: {
                        cell: (props: any) => (
                          <th
                            {...props}
                            style={{
                              ...props.style,
                              backgroundColor: '#e6f4ff',
                              fontWeight: 600,
                              color: '#1677ff',
                            }}
                          />
                        ),
                      },
                    }}
                    rowClassName={subRecord => {
                      if (subRecord.state === 'failed' || subRecord.state === 'aborted') {
                        return 'wu-row-failed';
                      }
                      if (subRecord.state === 'running' && (subRecord.totalClusterTime || 0) > 2) {
                        return 'wu-row-long-running';
                      }
                      return '';
                    }}
                    onRow={subRecord => ({
                      onClick: () => {
                        if (subRecord.clusterId && subRecord.wuId && subRecord.detailsFetchedAt) handleView(subRecord);
                      },
                      style: { cursor: subRecord.detailsFetchedAt ? 'pointer' : 'default' },
                    })}
                    scroll={{ x: 1100 }}
                  />
                </div>
              ),
            }}
            scroll={{ x: 1100 }}
          />
        )}
      </Card>
    </div>
  );
};

export default WorkUnitHistory;
